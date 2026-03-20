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
TEMP_DISABLE_CREDIT_BLOCKADE = os.getenv("TEMP_DISABLE_CREDIT_BLOCKADE", "true").lower() == "true"

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
    shareSlug: Optional[str] = None
    isPublic: bool = False
    trainingError: Optional[str] = None

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

def is_crawl_error_text(text: str) -> bool:
    if not text:
        return False
    lowered = text.lower()
    error_markers = [
        "error during crawling",
        "playwright",
        "chromium",
        "missing browser executable",
        "failed to launch browser",
        "traceback",
        "crawlerrunconfig",
    ]
    return any(marker in lowered for marker in error_markers)

def make_share_slug(name: str, chatbot_id: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", (name or "chatbot").lower()).strip("-")
    if not base:
        base = "chatbot"
    return f"{base}-{chatbot_id.split('-')[0]}"

def reserve_unique_share_slug(cur, base_slug: str) -> str:
    candidate = base_slug
    counter = 1
    while True:
        cur.execute("SELECT 1 FROM chatbots WHERE share_slug = %s", (candidate,))
        if not cur.fetchone():
            return candidate
        counter += 1
        candidate = f"{base_slug}-{counter}"

def train_chatbot_sync(chatbot_id: str, website: str, limit: int = 10):
    """Sync task for threadpool to scrape and upsert."""
    try:
        print(f"Starting training for {chatbot_id} at {website} with limit {limit}", flush=True)
        raw_text = get_data(website, limit=limit)

        if not raw_text or not raw_text.strip() or is_crawl_error_text(raw_text):
            raise ValueError("Crawler returned no valid content. Please verify crawl dependencies and target website.")
        
        splitter = RecursiveCharacterTextSplitter.from_language(
            language="markdown",
            chunk_size=500,
            chunk_overlap=50,
        )
        
        chunks = splitter.split_text(raw_text)
        chunks = [clean_text(chunk) for chunk in chunks]
        chunks = [chunk for chunk in chunks if chunk and not is_crawl_error_text(chunk)]

        if not chunks:
            raise ValueError("No valid training chunks were produced from crawl output.")
        
        records = [
            {
                "_id": f"{chatbot_id}-chunk-{i}",
                "chunk_text": chunk,
            }
            for i, chunk in enumerate(chunks)
        ]
        
        # Clear stale vectors before upserting fresh training chunks.
        try:
            index.delete(delete_all=True, namespace=chatbot_id)
        except Exception as cleanup_error:
            print(f"Namespace cleanup warning for {chatbot_id}: {cleanup_error}", flush=True)

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
                "UPDATE chatbots SET status = %s, pages_scraped = %s, last_updated = %s, last_error = NULL WHERE id = %s",
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
            cur.execute(
                "UPDATE chatbots SET status = %s, last_error = %s WHERE id = %s",
                ("error", str(e)[:2000], chatbot_id),
            )
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
        
        filtered_chunks = []
        for hit in results.result.hits:
            chunk_text = hit["fields"]["chunk_text"]
            if is_crawl_error_text(chunk_text):
                continue
            filtered_chunks.append(chunk_text)

        context = "\n\n".join(filtered_chunks)
    except Exception as e:
        print(f"Pinecone search error: {e}")
        context = ""

    # 3. Strict Prompting
    if context.strip():
        prompt = f"""You are Turbochat AI, A SaaS, which just takes the website url and trains the AI assistant on the website content.
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
            color=row["color"],
            shareSlug=row.get("share_slug"),
            isPublic=bool(row.get("is_public", False)),
            trainingError=row.get("last_error"),
        ) for row in rows
    ]

@app.post("/api/chatbots", response_model=ChatbotSchema)
async def create_chatbot(chatbot: ChatbotCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    if not TEMP_DISABLE_CREDIT_BLOCKADE and user["credits"] <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits. Please upgrade your plan.")

    chatbot_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Deduct a credit only when blockade is enabled.
        if not TEMP_DISABLE_CREDIT_BLOCKADE:
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
        model=OPENAI_MODEL,
        isPublic=False,
        trainingError=None,
    )

@app.get("/api/chatbots/{chatbot_id}/share")
async def get_chatbot_share(chatbot_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, share_slug, is_public FROM chatbots WHERE id = %s AND user_id = %s",
            (chatbot_id, user["id"]),
        )
        row = cur.fetchone()
        cur.close()
        if not row:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        return {
            "chatbotId": row["id"],
            "name": row["name"],
            "shareSlug": row["share_slug"],
            "isPublic": bool(row["is_public"]),
            "sharePath": f"/share/{row['share_slug']}" if row["share_slug"] else None,
        }
    finally:
        release_db_connection(conn)

@app.post("/api/chatbots/{chatbot_id}/share/publish")
async def publish_chatbot_share(chatbot_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, share_slug FROM chatbots WHERE id = %s AND user_id = %s",
            (chatbot_id, user["id"]),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Chatbot not found")

        share_slug = row["share_slug"]
        if not share_slug:
            base_slug = make_share_slug(row["name"], row["id"])
            share_slug = reserve_unique_share_slug(cur, base_slug)

        cur.execute(
            "UPDATE chatbots SET share_slug = %s, is_public = TRUE WHERE id = %s AND user_id = %s",
            (share_slug, chatbot_id, user["id"]),
        )
        conn.commit()
        cur.close()

        return {
            "status": "published",
            "chatbotId": chatbot_id,
            "shareSlug": share_slug,
            "sharePath": f"/share/{share_slug}",
            "isPublic": True,
        }
    except HTTPException:
        conn.rollback()
        raise
    finally:
        release_db_connection(conn)

@app.post("/api/chatbots/{chatbot_id}/share/unpublish")
async def unpublish_chatbot_share(chatbot_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "UPDATE chatbots SET is_public = FALSE WHERE id = %s AND user_id = %s RETURNING id, share_slug",
            (chatbot_id, user["id"]),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        conn.commit()
        cur.close()
        return {
            "status": "unpublished",
            "chatbotId": row["id"],
            "shareSlug": row["share_slug"],
            "isPublic": False,
        }
    except HTTPException:
        conn.rollback()
        raise
    finally:
        release_db_connection(conn)

@app.get("/api/public/chatbots/{share_slug}")
async def get_public_chatbot(share_slug: str):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, status, share_slug FROM chatbots WHERE share_slug = %s AND is_public = TRUE",
            (share_slug,),
        )
        row = cur.fetchone()
        cur.close()
        if not row:
            raise HTTPException(status_code=404, detail="Shared chatbot not found")

        return {
            "id": row["id"],
            "name": row["name"],
            "status": row["status"],
            "shareSlug": row["share_slug"],
        }
    finally:
        release_db_connection(conn)

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
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    plan: str
    credits: int
    event_id: Optional[str] = None

@app.post("/api/internal/webhook/dodo")
async def dodo_webhook_internal(payload: WebhookPayload):
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Idempotency: skip duplicate webhook deliveries.
        if payload.event_id:
            cur.execute("SELECT event_id FROM dodo_webhook_events WHERE event_id = %s", (payload.event_id,))
            existing = cur.fetchone()
            if existing:
                conn.commit()
                cur.close()
                return {"status": "ignored", "reason": "duplicate_event"}

        if not payload.user_id and not payload.user_email:
            raise HTTPException(status_code=400, detail="Missing user identifier")

        user_row = None
        if payload.user_id:
            cur.execute("SELECT id, email FROM users WHERE id = %s", (payload.user_id,))
            user_row = cur.fetchone()

        if not user_row and payload.user_email:
            cur.execute("SELECT id, email FROM users WHERE email = %s", (payload.user_email,))
            user_row = cur.fetchone()

        if user_row:
            target_user_id = user_row[0]
            cur.execute(
                "UPDATE users SET plan = %s, credits = credits + %s WHERE id = %s",
                (payload.plan, payload.credits, target_user_id),
            )
        else:
            # Webhook can occasionally arrive before first authenticated API call.
            generated_id = payload.user_id or str(uuid.uuid4())
            generated_email = payload.user_email or f"{generated_id}@unknown.local"
            cur.execute(
                "INSERT INTO users (id, email, credits, plan) VALUES (%s, %s, %s, %s)",
                (generated_id, generated_email, payload.credits, payload.plan),
            )

        if payload.event_id:
            cur.execute(
                "INSERT INTO dodo_webhook_events (event_id, processed_at) VALUES (%s, %s)",
                (payload.event_id, datetime.now().isoformat()),
            )

        conn.commit()
        cur.close()
        return {"status": "success"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(f"Internal webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
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

        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT user_id FROM chatbots WHERE id = %s", (chatbot_id,))
            owner_row = cur.fetchone()
            cur.close()
            if not owner_row:
                raise HTTPException(status_code=404, detail="Chatbot not found")
            owner_user_id = owner_row["user_id"]
        finally:
            release_db_connection(conn)
        
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
                "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chatbot_id, owner_user_id, "user", request.message, datetime.now().isoformat(), request.conversation_id)
            )
            cur.execute(
                "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chatbot_id, owner_user_id, "assistant", response, datetime.now().isoformat(), request.conversation_id)
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