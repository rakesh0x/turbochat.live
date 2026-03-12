"""FastAPI server for ChatBot AI with persistence and background training using OpenAI GPT-4."""
import os
import requests
import json
import base64
import unicodedata
import re
import uuid
from datetime import datetime
from typing import List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

from pinecone import Pinecone
from psycopg2.extras import RealDictCursor
from database import get_db_connection, release_db_connection, init_db, close_pool
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from scraper.fetch_html import get_data
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

# Initialize Database
init_db()

# FastAPI app
app = FastAPI(title="ChatBot AI API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Must be False if allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX", "chatbot")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

from openai import OpenAI
import google.generativeai as genai
# OpenAI setup
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Gemini setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Provider Logic
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()

# Supabase setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Pinecone setup
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# Thread pool for sync tasks
executor = ThreadPoolExecutor(max_workers=10)

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Decode the JWT payload without verifying signature (since we don't have JWT_SECRET)
        payload = token.split(".")[1]
        payload += "=" * ((4 - len(payload) % 4) % 4)
        decoded = base64.urlsafe_b64decode(payload).decode("utf-8")
        user_data = json.loads(decoded)
        user_id = user_data["sub"]
        email = user_data.get("email", "")
    except Exception as e:
        print(f"JWT Decode Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token architecture")

    # Ensure user exists in our DB
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()
        
        if not user_row:
            # Create user if logging in for the first time
            cur.execute(
                "INSERT INTO users (id, email, credits, plan) VALUES (%s, %s, %s, %s) RETURNING *",
                (user_id, email, 0, 'free')
            )
            user_row = cur.fetchone()
        conn.commit()
        cur.close()
        return user_row
    except Exception as e:
        print(f"Auth DB Error: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Database error during authentication")
    finally:
        release_db_connection(conn)


# Models
class ChatbotBase(BaseModel):
    name: str
    website: str

class ChatbotCreate(ChatbotBase):
    limit: Optional[int] = 10

class ChatbotSchema(ChatbotBase):
    id: str
    status: str
    pagesScraped: int
    monthlyMessages: int
    lastUpdated: str
    createdAt: str
    model: str
    color: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None

# Helper Functions
def clean_text(text: str) -> str:
    if not text: return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^\x00-\x7F]+", "", text)
    return text

def train_chatbot_sync(chatbot_id: str, website: str, limit: int = 10):
    """Sync task for threadpool to scrape and upsert."""
    try:
        print(f"Starting training for {chatbot_id} at {website} with limit {limit}", flush=True)
        raw_text = get_data(website, limit=limit)
        
        splitter = RecursiveCharacterTextSplitter.from_language(
            language="markdown",
            chunk_size=500,
            chunk_overlap=50,
        )
        
        chunks = splitter.split_text(raw_text)
        chunks = [clean_text(chunk) for chunk in chunks]
        
        records = [
            {
                "_id": f"{chatbot_id}-chunk-{i}",
                "chunk_text": chunk,
            }
            for i, chunk in enumerate(chunks)
        ]
        
        # Upsert to Pinecone
        BATCH_SIZE = 96
        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i:i + BATCH_SIZE]
            index.upsert_records(
                namespace=chatbot_id,
                records=batch,
            )
            
        # Update database status
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE chatbots SET status = %s, pages_scraped = %s, last_updated = %s WHERE id = %s",
                ("active", len(chunks), datetime.now().isoformat(), chatbot_id)
            )
            conn.commit()
            cur.close()
        finally:
            release_db_connection(conn)
        print(f"Chatbot {chatbot_id} trained successfully with {len(chunks)} chunks.", flush=True)
        
    except Exception as e:
        print(f"Error training chatbot {chatbot_id}: {e}")
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE chatbots SET status = %s WHERE id = %s", ("error", chatbot_id))
            conn.commit()
            cur.close()
            release_db_connection(conn)
        except:
            pass

async def train_chatbot_task(chatbot_id: str, website: str, limit: int = 10):
    """Wrapper to run the sync task in a thread."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, train_chatbot_sync, chatbot_id, website, limit)

def get_openai_response(prompt: str, model: str = OPENAI_MODEL) -> str:
    """Sync helper for OpenAI GPT-4 call."""
    if not client:
        return "OpenAI API key not configured."
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"OpenAI error: {e}")
        return "Sorry, I couldn't generate a response."

def get_gemini_response(prompt: str, model: str = GEMINI_MODEL) -> str:
    """Sync helper for Gemini call."""
    if not GEMINI_API_KEY:
        return "Gemini API key not configured."
    try:
        model_instance = genai.GenerativeModel(model)
        response = model_instance.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini error: {e}")
        return "Sorry, I couldn't generate a response."

def get_llm_response(prompt: str) -> str:
    """Helper to choose LLM provider."""
    if LLM_PROVIDER == "gemini":
        return get_gemini_response(prompt)
    return get_openai_response(prompt)

async def ask_question(chatbot_id: str, query: str, history: List[dict] = []) -> str:
    """Query Pinecone for context and send to Ollama for response."""
    loop = asyncio.get_event_loop()
    
    standalone_query = query
    if history:
        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history[-3:]])
        print(f"History for re-writing:\n{history_text}")
        rewrite_prompt = f"""Instructions: Convert the user's latest question into a standalone search query. Replace nouns like "he", "she", "it", "they", "this", "that" with the actual names or topics mentioned in the history.
Output only the search query.

Example:
History:
user: Who is Rakesh?
assistant: Rakesh is a developer.
Question: What are his projects?
Search Query: what are Rakesh's projects?

Conversation History:
{history_text}

Latest Question: {query}
Search Query:"""
        try:
            standalone_query = await loop.run_in_executor(executor, get_llm_response, rewrite_prompt)
            standalone_query = standalone_query.strip().split("\n")[0].replace("Search Query:", "").strip()
            print(f"Re-written query: '{standalone_query}' (Original: '{query}')")
        except:
            standalone_query = query
            print(f"Re-write failed, using original: {query}")

    # 2. Pinecone search with increased top_k
    try:
        results = await loop.run_in_executor(
            executor, 
            lambda: index.search(
                namespace=chatbot_id,
                query={
                    "top_k": 7,
                    "inputs": {"text": standalone_query},
                },
            )
        )
        
        context = "\n\n".join(
            hit["fields"]["chunk_text"]
            for hit in results.result.hits
        )
    except Exception as e:
        print(f"Pinecone search error: {e}")
        context = ""

    # 3. Strict Prompting
    if context.strip():
        prompt = f"""You are SiteChat AI, A SaaS, which just takes the website url and trains the AI assistant on the website content.
Rules:
1. try every possible way to get answer as fast as possible"
2. try every possible way to answer the question
3. if you don't have the answer, try to get the context of the data 
2. Do NOT use outside knowledge.
3. Keep it brief and factual.

Context:
{context}

Question: {query}
Answer:"""
    else:
        prompt = f"""You are Enclose AI Assistant. 
The user asked: {query}
Since you have no training data for this topic, politely say you don't know the answer yet."""

    prompt = clean_text(prompt)
    
    # Call LLM in thread
    response = await loop.run_in_executor(executor, get_llm_response, prompt)
    return response.strip()

# Endpoints
@app.get("/api/chatbots", response_model=List[ChatbotSchema])
async def list_chatbots(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM chatbots WHERE user_id = %s", (user["id"],))
        rows = cur.fetchall()
        cur.close()
    finally:
        release_db_connection(conn)
    
    return [
        ChatbotSchema(
            id=row["id"],
            name=row["name"],
            website=row["website"],
            status=row["status"],
            pagesScraped=row["pages_scraped"],
            monthlyMessages=row["monthly_messages"],
            lastUpdated=str(row["last_updated"]),
            createdAt=str(row["created_at"]),
            model=row["model"],
            color=row["color"]
        ) for row in rows
    ]

@app.post("/api/chatbots", response_model=ChatbotSchema)
async def create_chatbot(chatbot: ChatbotCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    if user["credits"] <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits. Please upgrade your plan.")

    chatbot_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Deduct 1 credit for creating a chatbot
        cur.execute("UPDATE users SET credits = credits - 1 WHERE id = %s AND credits > 0", (user["id"],))
        if cur.rowcount == 0:
             conn.rollback()
             raise HTTPException(status_code=402, detail="Insufficient credits.")
             
        cur.execute(
            "INSERT INTO chatbots (id, user_id, name, website, status, last_updated, created_at, model) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (chatbot_id, user["id"], chatbot.name, chatbot.website, "training", now, now, OPENAI_MODEL)
        )
        conn.commit()
        cur.close()
    finally:
        release_db_connection(conn)
    
    background_tasks.add_task(train_chatbot_task, chatbot_id, chatbot.website, chatbot.limit or 10)
    
    return ChatbotSchema(
        id=chatbot_id,
        name=chatbot.name,
        website=chatbot.website,
        status="training",
        pagesScraped=0,
        monthlyMessages=0,
        lastUpdated=now,
        createdAt=now,
        model=OPENAI_MODEL
    )

@app.delete("/api/chatbots/{chatbot_id}")
async def delete_chatbot(chatbot_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM chatbots WHERE id = %s AND user_id = %s", (chatbot_id, user["id"]))
        conn.commit()
        cur.close()
    finally:
        release_db_connection(conn)
    try:
        index.delete(delete_all=True, namespace=chatbot_id)
    except:
        pass
    return {"status": "success"}

@app.get("/api/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM chatbots WHERE user_id = %s", (user["id"],))
        total_chatbots = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(pages_scraped), 0) FROM chatbots WHERE user_id = %s", (user["id"],))
        total_pages = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(monthly_messages), 0) FROM chatbots WHERE user_id = %s", (user["id"],))
        total_messages = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM chatbots WHERE status = 'training' AND user_id = %s", (user["id"],))
        training_bots = cur.fetchone()[0]
        cur.close()
    finally:
        release_db_connection(conn)
    
    return {
        "totalChatbots": total_chatbots,
        "totalPages": total_pages,
        "totalMessages": total_messages,
        "trainingBots": training_bots,
        "activeBots": total_chatbots - training_bots
    }

class WebhookPayload(BaseModel):
    user_id: str
    plan: str
    credits: int

@app.post("/api/internal/webhook/dodo")
async def dodo_webhook_internal(payload: WebhookPayload):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET plan = %s, credits = credits + %s WHERE id = %s", 
                   (payload.plan, payload.credits, payload.user_id))
        conn.commit()
        cur.close()
        return {"status": "success"}
    finally:
        release_db_connection(conn)

@app.get("/api/users/me")
async def get_user_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "credits": user["credits"],
        "plan": user["plan"]
    }

@app.get("/api/analytics")
async def get_analytics():
    # Mock analytics for the UI
    return {
        "messagesOverTime": [
            {"date": "Feb 1", "messages": 120},
            {"date": "Feb 5", "messages": 450},
            {"date": "Feb 10", "messages": 380}
        ],
        "topQuestions": [
            {"question": "How do I sign up?", "count": 45},
            {"question": "What is the pricing?", "count": 32}
        ]
    }

@app.post("/api/chatbots/{chatbot_id}/chat", response_model=ChatResponse)
async def chat(chatbot_id: str, request: ChatRequest):
    try:
        print(f"Chat request for bot {chatbot_id}")
        
        # Fetch history for query re-writing
        history = []
        if request.conversation_id:
            conn = get_db_connection()
            try:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                cur.execute(
                    "SELECT role, content FROM messages WHERE chatbot_id = %s AND conversation_id = %s ORDER BY timestamp DESC LIMIT 5",
                    (chatbot_id, request.conversation_id)
                )
                rows = cur.fetchall()
                cur.close()
            finally:
                release_db_connection(conn)
            history = [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]

        response = await ask_question(chatbot_id, request.message, history)
        
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("UPDATE chatbots SET monthly_messages = monthly_messages + 1 WHERE id = %s", (chatbot_id,))
            cur.execute(
                "INSERT INTO messages (id, chatbot_id, role, content, timestamp, conversation_id) VALUES (%s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chatbot_id, "user", request.message, datetime.now().isoformat(), request.conversation_id)
            )
            cur.execute(
                "INSERT INTO messages (id, chatbot_id, role, content, timestamp, conversation_id) VALUES (%s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chatbot_id, "assistant", response, datetime.now().isoformat(), request.conversation_id)
            )
            conn.commit()
            cur.close()
        finally:
            release_db_connection(conn)
        
        return ChatResponse(
            response=response,
            conversation_id=request.conversation_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chatbots/{chatbot_id}/conversation")
async def get_conversation(chatbot_id: str, sessionId: str = "default"):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT * FROM messages WHERE chatbot_id = %s AND conversation_id = %s ORDER BY timestamp ASC",
            (chatbot_id, sessionId)
        )
        rows = cur.fetchall()
        cur.close()
    finally:
        release_db_connection(conn)
    
    return {
        "messages": [
            {"id": row["id"], "role": row["role"], "content": row["content"], "timestamp": str(row["timestamp"])}
            for row in rows
        ]
    }

@app.on_event("shutdown")
def shutdown_event():
    close_pool()
    print("Database connection pool closed.")

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)