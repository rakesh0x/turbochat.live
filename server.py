"""FastAPI server for ChatBot AI with persistence and background training using OpenAI GPT-4."""
import os
import requests
import json
import re
import uuid
import base64
import unicodedata
from datetime import datetime, timedelta
from typing import List, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pinecone import Pinecone
from psycopg2.extras import RealDictCursor
from database import get_db_connection, release_db_connection, init_db, close_pool
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from scraper.fetch_html import get_data
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google.api_core import exceptions as google_exceptions

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
GEMINI_MODELS = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-flash-8b"]
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Provider Logic
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
TEMP_DISABLE_CREDIT_BLOCKADE = os.getenv("TEMP_DISABLE_CREDIT_BLOCKADE", "false").lower() == "true"

FREE_TRIAL_DAYS = 7
FREE_TRIAL_CHATBOT_LIMIT = 2
FREE_TRIAL_SUPPORT_CHAT_LIMIT = 15

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


def is_active_free_trial(user_row: dict, now_dt: Optional[datetime] = None) -> bool:
    now_dt = now_dt or datetime.now()
    plan = str(user_row.get("plan") or "free").lower()
    trial_ends_at = user_row.get("free_trial_reset_at")
    return plan == "free" and bool(trial_ends_at and trial_ends_at > now_dt)


# Models
class ChatbotBase(BaseModel):
    name: str
    website: str

class ChatbotCreate(ChatbotBase):
    limit: Optional[int] = 10

class ChatbotSchema(ChatbotBase):
    id: str
    status: str
    free_trial: int
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

        # --- Structured extraction pass ---
        # Run an LLM pass over the raw scraped text to pull out products/prices
        # into the structured_items table for SQL-based query filtering.
        try:
            n_items = _extract_structured_items_from_text(chatbot_id, raw_text)
            if n_items:
                print(f"[Extraction] {n_items} structured items extracted for {chatbot_id}", flush=True)
            else:
                print(f"[Extraction] No structured items found for {chatbot_id} (not a product site?)", flush=True)
        except Exception as ext_err:
            # Non-fatal — chatbot still works via semantic search even without extraction.
            print(f"[Extraction] Extraction failed for {chatbot_id}: {ext_err}", flush=True)
        
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

def get_gemini_response(prompt: str) -> str:
    """Sync helper for Gemini call with fallback loop for rate limits."""
    if not GEMINI_API_KEY:
        return "Gemini API key not configured."
    
    last_error = ""
    for model_name in GEMINI_MODELS:
        try:
            print(f"[Gemini] Trying {model_name}...")
            model_instance = genai.GenerativeModel(model_name)
            response = model_instance.generate_content(prompt)
            return response.text
        except google_exceptions.ResourceExhausted:
            print(f"[Gemini] {model_name} rate limit reached. Trying fallback...")
            last_error = "Rate limit reached for all models."
            continue
        except Exception as e:
            print(f"[Gemini] Error with {model_name}: {e}")
            last_error = str(e)
            return f"Sorry, I couldn't generate a response (Error: {last_error})."
            
    return f"Sorry, all models are currently exhausted. Please try again in 1 minute."

def get_llm_response(prompt: str) -> str:
    """Helper to choose LLM provider."""
    if LLM_PROVIDER == "gemini":
        return get_gemini_response(prompt)
    return get_openai_response(prompt)


# ---------------------------------------------------------------------------
# Structured data extraction — runs once per training to pull product/price
# data out of raw scraped text into the structured_items PostgreSQL table.
# This powers SQL-based filtering (price ranges, categories) at query time.
# ---------------------------------------------------------------------------

_PRICE_KEYWORDS = [
    "less than", "under", "below", "cheaper than", "affordable", "budget",
    "more than", "above", "over", "expensive", "premium",
    "between", "price range", "price",
    "show me", "list", "give me", "find me",
    "cheapest", "most expensive", "lowest price", "highest price",
    "what products", "what items", "what services",
    "sort by price", "order by price",
]

def _is_structured_query(query: str) -> bool:
    """Return True if the query likely needs structured / numeric filtering."""
    q = query.lower()
    return any(kw in q for kw in _PRICE_KEYWORDS)


def _parse_price_constraints(query: str):
    """Extract (min_price, max_price, sort) from free-form query. Returns dict."""
    q = query.lower()
    min_price = max_price = None
    sort_asc = True  # default: cheapest first

    between = re.search(
        r"between\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:and|to|-)\s*\$?\s*([\d,]+(?:\.\d+)?)", q
    )
    under = re.search(
        r"(?:under|below|less than|cheaper than|at most|max)\s*\$?\s*([\d,]+(?:\.\d+)?)", q
    )
    over = re.search(
        r"(?:above|over|more than|greater than|at least|min)\s*\$?\s*([\d,]+(?:\.\d+)?)", q
    )

    if between:
        min_price = float(between.group(1).replace(",", ""))
        max_price = float(between.group(2).replace(",", ""))
    else:
        if under:
            max_price = float(under.group(1).replace(",", ""))
        if over:
            min_price = float(over.group(1).replace(",", ""))

    if "expensive" in q or "highest" in q or "most expensive" in q:
        sort_asc = False

    return {"min_price": min_price, "max_price": max_price, "sort_asc": sort_asc}


def _query_structured_items(chatbot_id: str, constraints: dict) -> str | None:
    """Run a SQL price query and return formatted product list, or None if empty."""
    min_p = constraints["min_price"]
    max_p = constraints["max_price"]
    sort_dir = "ASC" if constraints["sort_asc"] else "DESC"

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if min_p is not None and max_p is not None:
            cur.execute(
                f"SELECT name, price, currency, category, description FROM structured_items "
                f"WHERE chatbot_id=%s AND price BETWEEN %s AND %s ORDER BY price {sort_dir} LIMIT 25",
                (chatbot_id, min_p, max_p),
            )
        elif max_p is not None:
            cur.execute(
                f"SELECT name, price, currency, category, description FROM structured_items "
                f"WHERE chatbot_id=%s AND price IS NOT NULL AND price <= %s ORDER BY price {sort_dir} LIMIT 25",
                (chatbot_id, max_p),
            )
        elif min_p is not None:
            cur.execute(
                f"SELECT name, price, currency, category, description FROM structured_items "
                f"WHERE chatbot_id=%s AND price IS NOT NULL AND price >= %s ORDER BY price {sort_dir} LIMIT 25",
                (chatbot_id, min_p),
            )
        else:
            # General listing — return all with known prices, sorted
            cur.execute(
                f"SELECT name, price, currency, category, description FROM structured_items "
                f"WHERE chatbot_id=%s AND price IS NOT NULL ORDER BY price {sort_dir} LIMIT 25",
                (chatbot_id,),
            )

        rows = cur.fetchall()
        cur.close()
    finally:
        release_db_connection(conn)

    if not rows:
        return None

    lines = []
    for r in rows:
        currency = r.get("currency") or "USD"
        price_str = f"{currency} {r['price']:.2f}" if r["price"] else "Price not listed"
        line = f"• {r['name']} — {price_str}"
        if r.get("category"):
            line += f" [{r['category']}]"
        if r.get("description"):
            line += f": {str(r['description'])[:120]}"
        lines.append(line)

    return "\n".join(lines)


def _extract_structured_items_from_text(chatbot_id: str, raw_text: str) -> int:
    """
    Call the LLM to extract structured product/service data from scraped text,
    then upsert into the structured_items table.
    Returns the number of items extracted.
    """
    # Feed up to 12000 chars — enough for a typical product catalog section.
    excerpt = clean_text(raw_text[:12000])
    if not excerpt.strip():
        return 0

    extraction_prompt = f"""You are a data extraction assistant. Extract ALL products, services, or items with their prices from the website content below.

Return ONLY a valid JSON array (no explanation, no markdown fences). Each element must have exactly these keys:
- "name": string — product / service name (required)
- "price": number or null — numeric price only (no currency symbol, no commas)
- "currency": string — 3-letter currency code, default "USD"
- "category": string or null — product category / type
- "description": string or null — 1-2 sentence description
- "url": string or null — product page URL if visible in content

If there are no products or prices, return an empty array [].

Website content:
{excerpt}

JSON array:"""

    try:
        raw_response = get_llm_response(extraction_prompt)
        # Strip any accidental markdown fences
        raw_response = re.sub(r"```(?:json)?\s*", "", raw_response).strip().rstrip("`")
        # Find the JSON array
        match = re.search(r"\[.*\]", raw_response, re.DOTALL)
        if not match:
            print(f"[Extraction] No JSON array found for chatbot {chatbot_id}")
            return 0
        items = json.loads(match.group())
        if not isinstance(items, list):
            return 0
    except Exception as e:
        print(f"[Extraction] LLM/parse error for {chatbot_id}: {e}")
        return 0

    if not items:
        return 0

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        # Clear stale data for this chatbot before inserting fresh extraction.
        cur.execute("DELETE FROM structured_items WHERE chatbot_id = %s", (chatbot_id,))
        inserted = 0
        for item in items:
            if not isinstance(item, dict) or not item.get("name"):
                continue
            raw_price = item.get("price")
            try:
                price = float(str(raw_price).replace(",", "")) if raw_price is not None else None
            except (ValueError, TypeError):
                price = None
            cur.execute(
                "INSERT INTO structured_items "
                "(chatbot_id, name, price, currency, category, description, url, raw_data) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    chatbot_id,
                    str(item.get("name", ""))[:500],
                    price,
                    str(item.get("currency", "USD"))[:10],
                    str(item.get("category", "") or "")[:200] or None,
                    str(item.get("description", "") or "")[:1000] or None,
                    str(item.get("url", "") or "")[:500] or None,
                    json.dumps(item),
                ),
            )
            inserted += 1
        conn.commit()
        cur.close()
        print(f"[Extraction] Stored {inserted} structured items for chatbot {chatbot_id}")
        return inserted
    except Exception as e:
        conn.rollback()
        print(f"[Extraction] DB write error for {chatbot_id}: {e}")
        return 0
    finally:
        release_db_connection(conn)

# ---------------------------------------------------------------------------
# Pronoun / coreference heuristic — only rewrite the query if it seems to
# reference a prior message. Avoids a full LLM round-trip on fresh questions.
# ---------------------------------------------------------------------------
_PRONOUN_HINTS = [
    " he ", " she ", " it ", " they ", " them ", " his ", " her ", " its ",
    " their ", " this ", " that ", " these ", " those ", " the same ",
    "tell me more", "what about", "and ", "also ", "how about",
]

def _needs_rewrite(query: str) -> bool:
    q = " " + query.lower() + " "
    return any(hint in q for hint in _PRONOUN_HINTS)


async def ask_question(chatbot_id: str, query: str, history: List[dict] = []) -> str:
    """Query Pinecone (semantic) and/or PostgreSQL (structured) then call LLM."""
    loop = asyncio.get_event_loop()

    # 1. Query rewrite — only when there is history AND the query has pronouns.
    # Skipping this saves a full Gemini round-trip (~2-3s) on most requests.
    standalone_query = query
    if history and _needs_rewrite(query):
        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history[-3:]])
        rewrite_prompt = (
            "Convert the user's question into a self-contained search query. "
            "Replace pronouns with the actual names/topics from history. "
            "Output only the rewritten query, nothing else.\n\n"
            f"History:\n{history_text}\n\nQuestion: {query}\nRewritten:"
        )
        try:
            standalone_query = await loop.run_in_executor(executor, get_llm_response, rewrite_prompt)
            standalone_query = standalone_query.strip().split("\n")[0].strip()
        except Exception:
            standalone_query = query

    # 2. Run Pinecone + SQL in PARALLEL — both are independent.
    async def _pinecone_search():
        try:
            results = await loop.run_in_executor(
                executor,
                lambda: index.search(
                    namespace=chatbot_id,
                    query={"top_k": 7, "inputs": {"text": standalone_query}},
                ),
            )
            return "\n\n".join(
                hit["fields"]["chunk_text"]
                for hit in results.result.hits
                if not is_crawl_error_text(hit["fields"]["chunk_text"])
            )
        except Exception as e:
            print(f"Pinecone search error: {e}")
            return ""

    async def _sql_search():
        if not _is_structured_query(standalone_query):
            return ""
        try:
            constraints = _parse_price_constraints(standalone_query)
            result = await loop.run_in_executor(
                executor, _query_structured_items, chatbot_id, constraints
            )
            return result or ""
        except Exception as e:
            print(f"[Router] SQL search error: {e}")
            return ""

    semantic_context, structured_context = await asyncio.gather(
        _pinecone_search(), _sql_search()
    )

    # 3. Build prompt based on what data we have.
    prompt = _build_prompt(query, semantic_context, structured_context)
    prompt = clean_text(prompt)
    response = await loop.run_in_executor(executor, get_llm_response, prompt)
    return response.strip()


def _build_prompt(query: str, semantic_context: str, structured_context: str) -> str:
    """Construct the LLM prompt from retrieved context."""
    if structured_context:
        supplement = (
            f"\n\nAdditional website context:\n{semantic_context}"
            if semantic_context.strip() else ""
        )
        return (
            "You are a helpful assistant for this business with access to the product catalog.\n\n"
            f"Customer question: {query}\n\n"
            f"Matching products from our catalog:\n{structured_context}{supplement}\n\n"
            "Instructions:\n"
            "- USE MARKDOWN formatting for your response.\n"
            "- Put every bullet point or item on a separate NEW LINE.\n"
            "- Use bolding (**item**) for product names or key terms.\n"
            "- Only include products that satisfy the customer's filter.\n"
            "- If no products match exactly, say so honestly.\n"
            "- Be concise and friendly.\n\nResponse:"
        )
    if semantic_context.strip():
        return (
            "You are a helpful assistant trained on this business's website content.\n"
            "Answer only from the provided context. Be concise and factual.\n\n"
            "Formatting Rules:\n"
            "1. USE MARKDOWN (**bolding**, *italics*, etc.).\n"
            "2. If you are listing points, put each point on its own NEW LINE starting with a bullet point (*).\n\n"
            f"Context:\n{semantic_context}\n\nQuestion: {query}\nAnswer:"
        )
    return (
        f"You are a helpful assistant for this business. The customer asked: {query}\n"
        "You don't have enough information to answer this question yet. "
        "Apologize briefly and suggest they contact the business directly."
    )


# ---------------------------------------------------------------------------
# Streaming LLM helpers — yield text tokens as they arrive so the frontend
# can start rendering immediately instead of waiting for the full response.
# ---------------------------------------------------------------------------

def _stream_gemini(prompt: str):
    """Yield text chunks from Gemini with automatic fallback on ResourceExhausted."""
    if not GEMINI_API_KEY:
        yield "Gemini API key not configured."
        return

    for model_name in GEMINI_MODELS:
        try:
            print(f"[Gemini-Stream] Trying {model_name}...")
            model_instance = genai.GenerativeModel(model_name)
            response = model_instance.generate_content(prompt, stream=True)
            for chunk in response:
                text = getattr(chunk, "text", None)
                if text:
                    yield text
            # If we successfully finish the loop, we are done
            return
        except google_exceptions.ResourceExhausted:
            print(f"[Gemini-Stream] {model_name} rate limit reached. Switching fallback...")
            continue
        except Exception as e:
            print(f"[Gemini-Stream] Error with {model_name}: {e}")
            yield f"Error: {str(e)}"
            return
            
    yield "All Gemini models are currently busy. Please try again shortly."


def _stream_openai(prompt: str):
    """Yield text chunks from OpenAI streaming API."""
    if not client:
        yield "OpenAI API key not configured."
        return
    try:
        stream = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta
    except Exception as e:
        print(f"OpenAI stream error: {e}")
        yield "Sorry, I couldn't generate a response."


def _stream_llm(prompt: str):
    """Choose streaming provider."""
    if LLM_PROVIDER == "gemini":
        return _stream_gemini(prompt)
    return _stream_openai(prompt)

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
    
    active_trial = is_active_free_trial(user)
    remaining_free_trials = max(0, FREE_TRIAL_CHATBOT_LIMIT - len(rows)) if active_trial else 0

    return [
        ChatbotSchema(
            id=row["id"],
            name=row["name"],
            free_trial=remaining_free_trials,
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
    chatbot_id = str(uuid.uuid4())
    now_dt = datetime.now()
    now = now_dt.isoformat()
    remaining_free_trials = int(user.get("free_trial_remaining", 0))
    
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if not TEMP_DISABLE_CREDIT_BLOCKADE:
            # Lock usage row so credits/free-trial cannot be double-consumed by concurrent requests.
            cur.execute(
                "SELECT credits, plan, free_trial_remaining, free_trial_reset_at FROM users WHERE id = %s FOR UPDATE",
                (user["id"],),
            )
            usage_row = cur.fetchone()
            if not usage_row:
                raise HTTPException(status_code=404, detail="User not found")

            credits = int(usage_row.get("credits") or 0)
            plan = str(usage_row.get("plan") or "free").lower()
            reset_at = usage_row.get("free_trial_reset_at")

            if plan == "free":
                if not reset_at or reset_at <= now_dt:
                    cur.execute(
                        "UPDATE users SET free_trial_remaining = %s WHERE id = %s",
                        (0, user["id"]),
                    )
                    raise HTTPException(
                        status_code=402,
                        detail="Your 7-day free trial has ended. Subscribe to continue.",
                    )

                cur.execute("SELECT COUNT(*) AS total FROM chatbots WHERE user_id = %s", (user["id"],))
                chatbot_total = int(cur.fetchone()["total"])
                if chatbot_total >= FREE_TRIAL_CHATBOT_LIMIT:
                    raise HTTPException(
                        status_code=402,
                        detail=f"Free trial allows up to {FREE_TRIAL_CHATBOT_LIMIT} chatbots.",
                    )

                remaining_free_trials = max(0, FREE_TRIAL_CHATBOT_LIMIT - (chatbot_total + 1))
                cur.execute(
                    "UPDATE users SET free_trial_remaining = %s WHERE id = %s",
                    (remaining_free_trials, user["id"]),
                )
            elif credits > 0:
                cur.execute("UPDATE users SET credits = credits - 1 WHERE id = %s", (user["id"],))
            else:
                raise HTTPException(status_code=402, detail="Insufficient credits. Please upgrade your plan.")
             
        cur.execute(
            "INSERT INTO chatbots (id, user_id, name, website, status, last_updated, created_at, model) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (chatbot_id, user["id"], chatbot.name, chatbot.website, "training", now, now, OPENAI_MODEL)
        )
        conn.commit()
        cur.close()
    except HTTPException:
        conn.rollback()
        raise
    finally:
        release_db_connection(conn)
    
    background_tasks.add_task(train_chatbot_task, chatbot_id, chatbot.website, chatbot.limit or 10)
    
    return ChatbotSchema(
        id=chatbot_id,
        name=chatbot.name,
        free_trial=remaining_free_trials,
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
    now_dt = datetime.now()
    active_trial = is_active_free_trial(user, now_dt)

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM chatbots WHERE user_id = %s", (user["id"],))
        total_chatbots = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM messages WHERE user_id = %s AND role = 'user'", (user["id"],))
        used_support_chats = cur.fetchone()[0]
        cur.close()
    finally:
        release_db_connection(conn)

    chatbot_remaining = max(0, FREE_TRIAL_CHATBOT_LIMIT - total_chatbots) if active_trial else 0
    support_chat_remaining = max(0, FREE_TRIAL_SUPPORT_CHAT_LIMIT - used_support_chats) if active_trial else 0

    return {
        "id": user["id"],
        "email": user["email"],
        "credits": user["credits"],
        "plan": user["plan"],
        "freeTrialRemaining": chatbot_remaining,
        "freeTrialResetAt": str(user.get("free_trial_reset_at")),
        "freeTrialActive": active_trial,
        "freeTrialSupportChatsRemaining": support_chat_remaining,
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

        now_dt = datetime.now()

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

        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT plan, free_trial_reset_at FROM users WHERE id = %s", (owner_user_id,))
            owner_usage = cur.fetchone()
            if not owner_usage:
                raise HTTPException(status_code=404, detail="Owner account not found")

            if is_active_free_trial(owner_usage, now_dt):
                cur.execute(
                    "SELECT COUNT(*) AS total FROM messages WHERE user_id = %s AND role = 'user'",
                    (owner_user_id,),
                )
                used_support_chats = int(cur.fetchone()["total"])
                if used_support_chats >= FREE_TRIAL_SUPPORT_CHAT_LIMIT:
                    raise HTTPException(
                        status_code=402,
                        detail=f"Free trial allows up to {FREE_TRIAL_SUPPORT_CHAT_LIMIT} support chats.",
                    )
            cur.close()
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chatbots/{chatbot_id}/chat/stream")
async def chat_stream(chatbot_id: str, request: ChatRequest):
    """
    Streaming version of chat via Server-Sent Events.
    The frontend consumes tokens as they arrive, making the first word visible
    in ~1s instead of waiting 8-10s for the full response.

    SSE format:
      data: {"token": "Hello"}
      data: {"token": " world"}
      data: {"done": true, "conversation_id": "..."}
      data: {"error": "..."}
    """
    now_dt = datetime.now()

    # --- Pre-flight DB checks (parallelize owner + usage lookup) ---
    async def _get_owner():
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT user_id FROM chatbots WHERE id = %s", (chatbot_id,))
            row = cur.fetchone()
            cur.close()
            return row
        finally:
            release_db_connection(conn)

    owner_row = await _get_owner()
    if not owner_row:
        async def _not_found():
            yield f'data: {{"error": "Chatbot not found"}}\n\n'
        return StreamingResponse(_not_found(), media_type="text/event-stream")

    owner_user_id = owner_row["user_id"]

    # Free-trial support-chat gate
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT plan, free_trial_reset_at FROM users WHERE id = %s", (owner_user_id,))
        owner_usage = cur.fetchone()
        if owner_usage and is_active_free_trial(owner_usage, now_dt):
            cur.execute(
                "SELECT COUNT(*) AS total FROM messages WHERE user_id = %s AND role = 'user'",
                (owner_user_id,),
            )
            used = int(cur.fetchone()["total"])
            if used >= FREE_TRIAL_SUPPORT_CHAT_LIMIT:
                cur.close()
                async def _limit():
                    yield f'data: {{"error": "Free trial chat limit reached."}}\n\n'
                return StreamingResponse(_limit(), media_type="text/event-stream")
        cur.close()
    finally:
        release_db_connection(conn)

    # Fetch conversation history
    history: List[dict] = []
    if request.conversation_id:
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT role, content FROM messages "
                "WHERE chatbot_id=%s AND conversation_id=%s ORDER BY timestamp DESC LIMIT 5",
                (chatbot_id, request.conversation_id),
            )
            rows = cur.fetchall()
            cur.close()
            history = [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]
        finally:
            release_db_connection(conn)

    # Build context (same parallel Pinecone+SQL as ask_question)
    loop = asyncio.get_event_loop()
    standalone_query = request.message
    if history and _needs_rewrite(request.message):
        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history[-3:]])
        rw_prompt = (
            "Rewrite as a standalone search query (replace pronouns). "
            "Output only the rewritten query.\n\n"
            f"History:\n{history_text}\nQuestion: {request.message}\nRewritten:"
        )
        try:
            standalone_query = await loop.run_in_executor(executor, get_llm_response, rw_prompt)
            standalone_query = standalone_query.strip().split("\n")[0].strip()
        except Exception:
            standalone_query = request.message

    async def _pinecone():
        try:
            results = await loop.run_in_executor(
                executor,
                lambda: index.search(
                    namespace=chatbot_id,
                    query={"top_k": 7, "inputs": {"text": standalone_query}},
                ),
            )
            return "\n\n".join(
                h["fields"]["chunk_text"]
                for h in results.result.hits
                if not is_crawl_error_text(h["fields"]["chunk_text"])
            )
        except Exception:
            return ""

    async def _sql():
        if not _is_structured_query(standalone_query):
            return ""
        try:
            c = _parse_price_constraints(standalone_query)
            r = await loop.run_in_executor(executor, _query_structured_items, chatbot_id, c)
            return r or ""
        except Exception:
            return ""

    semantic_ctx, structured_ctx = await asyncio.gather(_pinecone(), _sql())
    prompt = clean_text(_build_prompt(request.message, semantic_ctx, structured_ctx))

    conversation_id = request.conversation_id

    async def event_generator():
        full_tokens: List[str] = []
        try:
            # Stream tokens from LLM in executor so we don't block the event loop
            token_queue: asyncio.Queue = asyncio.Queue()

            def _produce():
                try:
                    for token in _stream_llm(prompt):
                        loop.call_soon_threadsafe(token_queue.put_nowait, token)
                except Exception as err:
                    loop.call_soon_threadsafe(token_queue.put_nowait, Exception(str(err)))
                finally:
                    loop.call_soon_threadsafe(token_queue.put_nowait, None)  # sentinel

            loop.run_in_executor(executor, _produce)

            while True:
                item = await token_queue.get()
                if item is None:
                    break
                if isinstance(item, Exception):
                    yield f'data: {{"error": "{str(item)}"}}\'\n\n'
                    return
                full_tokens.append(item)
                payload = json.dumps({"token": item})
                yield f"data: {payload}\n\n"

        except Exception as gen_err:
            yield f'data: {{"error": "{gen_err}"}}\n\n'
            return

        # Persist messages to DB after stream completes
        full_response = "".join(full_tokens)
        try:
            conn2 = get_db_connection()
            try:
                cur2 = conn2.cursor()
                cur2.execute(
                    "UPDATE chatbots SET monthly_messages = monthly_messages + 1 WHERE id = %s",
                    (chatbot_id,),
                )
                cur2.execute(
                    "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (str(uuid.uuid4()), chatbot_id, owner_user_id, "user",
                     request.message, datetime.now().isoformat(), conversation_id),
                )
                cur2.execute(
                    "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (str(uuid.uuid4()), chatbot_id, owner_user_id, "assistant",
                     full_response, datetime.now().isoformat(), conversation_id),
                )
                conn2.commit()
                cur2.close()
            finally:
                release_db_connection(conn2)
        except Exception as db_err:
            print(f"[Stream] DB persist error: {db_err}")

        done_payload = json.dumps({"done": True, "conversation_id": conversation_id})
        yield f"data: {done_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Connection": "keep-alive",
        },
    )

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