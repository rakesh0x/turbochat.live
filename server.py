"""FastAPI server for ChatBot AI with persistence and background training using OpenAI GPT-4."""
import os
import requests
import json
import unicodedata
import re
import uuid
from datetime import datetime
from typing import List, Optional
import asyncio
from transformers import pipeline
import torch
from concurrent.futures import ThreadPoolExecutor

from pinecone import Pinecone
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from database import get_db_connection, init_db
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

# Pinecone setup
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# Thread pool for sync tasks
executor = ThreadPoolExecutor(max_workers=10)

# Models
class ChatbotBase(BaseModel):
    name: str
    website: str

class ChatbotCreate(ChatbotBase):
    pass

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

def train_chatbot_sync(chatbot_id: str, website: str):
    """Sync task for threadpool to scrape and upsert."""
    try:
        print(f"Starting training for {chatbot_id} at {website}")
        raw_text = get_data(website)
        
        splitter = RecursiveCharacterTextSplitter(
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
        conn.execute(
            "UPDATE chatbots SET status = ?, pages_scraped = ?, last_updated = ? WHERE id = ?",
            ("active", len(chunks), datetime.now().isoformat(), chatbot_id)
        )
        conn.commit()
        conn.close()
        print(f"Chatbot {chatbot_id} trained successfully with {len(chunks)} chunks.")
        
    except Exception as e:
        print(f"Error training chatbot {chatbot_id}: {e}")
        try:
            conn = get_db_connection()
            conn.execute("UPDATE chatbots SET status = ? WHERE id = ?", ("error", chatbot_id))
            conn.commit()
            conn.close()
        except:
            pass

async def train_chatbot_task(chatbot_id: str, website: str):
    """Wrapper to run the sync task in a thread."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, train_chatbot_sync, chatbot_id, website)

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
        prompt = f"""You are Enclose AI Assistant. Answer the question ONLY using the Context below.
Rules:
1. If the answer is not in the context, say "I haven't been trained on this yet."
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
async def list_chatbots():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM chatbots").fetchall()
    conn.close()
    
    return [
        ChatbotSchema(
            id=row["id"],
            name=row["name"],
            website=row["website"],
            status=row["status"],
            pagesScraped=row["pages_scraped"],
            monthlyMessages=row["monthly_messages"],
            lastUpdated=row["last_updated"],
            createdAt=row["created_at"],
            model=row["model"],
            color=row["color"]
        ) for row in rows
    ]

@app.post("/api/chatbots", response_model=ChatbotSchema)
async def create_chatbot(chatbot: ChatbotCreate, background_tasks: BackgroundTasks):
    chatbot_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO chatbots (id, name, website, status, last_updated, created_at, model) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (chatbot_id, chatbot.name, chatbot.website, "training", now, now, OPENAI_MODEL)
    )
    conn.commit()
    conn.close()
    
    background_tasks.add_task(train_chatbot_task, chatbot_id, chatbot.website)
    
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
async def delete_chatbot(chatbot_id: str):
    conn = get_db_connection()
    conn.execute("DELETE FROM chatbots WHERE id = ?", (chatbot_id,))
    conn.commit()
    conn.close()
    try:
        index.delete(delete_all=True, namespace=chatbot_id)
    except:
        pass
    return {"status": "success"}

@app.get("/api/stats")
async def get_stats():
    conn = get_db_connection()
    total_chatbots = conn.execute("SELECT COUNT(*) FROM chatbots").fetchone()[0]
    total_pages = conn.execute("SELECT SUM(pages_scraped) FROM chatbots").fetchone()[0] or 0
    total_messages = conn.execute("SELECT SUM(monthly_messages) FROM chatbots").fetchone()[0] or 0
    training_bots = conn.execute("SELECT COUNT(*) FROM chatbots WHERE status = 'training'").fetchone()[0]
    conn.close()
    
    return {
        "totalChatbots": total_chatbots,
        "totalPages": total_pages,
        "totalMessages": total_messages,
        "trainingBots": training_bots,
        "activeBots": total_chatbots - training_bots
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
            rows = conn.execute(
                "SELECT role, content FROM messages WHERE chatbot_id = ? AND conversation_id = ? ORDER BY timestamp DESC LIMIT 5",
                (chatbot_id, request.conversation_id)
            ).fetchall()
            conn.close()
            history = [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]

        response = await ask_question(chatbot_id, request.message, history)
        
        conn = get_db_connection()
        conn.execute("UPDATE chatbots SET monthly_messages = monthly_messages + 1 WHERE id = ?", (chatbot_id,))
        conn.execute(
            "INSERT INTO messages (id, chatbot_id, role, content, timestamp, conversation_id) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), chatbot_id, "user", request.message, datetime.now().isoformat(), request.conversation_id)
        )
        conn.execute(
            "INSERT INTO messages (id, chatbot_id, role, content, timestamp, conversation_id) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), chatbot_id, "assistant", response, datetime.now().isoformat(), request.conversation_id)
        )
        conn.commit()
        conn.close()
        
        return ChatResponse(
            response=response,
            conversation_id=request.conversation_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chatbots/{chatbot_id}/conversation")
async def get_conversation(chatbot_id: str, sessionId: str = "default"):
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM messages WHERE chatbot_id = ? AND conversation_id = ? ORDER BY timestamp ASC",
        (chatbot_id, sessionId)
    ).fetchall()
    conn.close()
    
    return {
        "messages": [
            {"id": row["id"], "role": row["role"], "content": row["content"], "timestamp": row["timestamp"]}
            for row in rows
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)