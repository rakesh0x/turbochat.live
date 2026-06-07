import asyncio
import json
import re
import unicodedata
from datetime import datetime
from typing import List

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from langchain_text_splitters import RecursiveCharacterTextSplitter
from psycopg2.extras import RealDictCursor

from database import get_db_connection, release_db_connection
from scraper.fetch_html import get_data

from .config import (
    GEMINI_API_KEY,
    GEMINI_MODELS,
    LLM_PROVIDER,
    OPENAI_MODEL,
    GROQ_MODEL,
    client,
    groq_client,
    executor,
    index,
)

def clean_text(text: str) -> str:
    if not text:
        return ""
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
    try:
        print(f"`Start`ing training for {chatbot_id} at {website} with limit {limit}", flush=True)
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

        try:
            index.delete(delete_all=True, namespace=chatbot_id)
        except Exception as cleanup_error:
            print(f"Namespace cleanup warning for {chatbot_id}: {cleanup_error}", flush=True)

        batch_size = 96
        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]
            index.upsert_records(
                namespace=chatbot_id,
                records=batch,
            )

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "UPDATE chatbots SET status = %s, pages_scraped = %s, last_updated = %s, last_error = NULL WHERE id = %s",
                ("active", len(chunks), datetime.now().isoformat(), chatbot_id),
            )
            conn.commit()
            cur.close()
        finally:
            release_db_connection(conn)
        print(f"Chatbot {chatbot_id} trained successfully with {len(chunks)} chunks.", flush=True)

        try:
            n_items = _extract_structured_items_from_text(chatbot_id, raw_text)
            if n_items:
                print(f"[Extraction] {n_items} structured items extracted for {chatbot_id}", flush=True)
            else:
                print(f"[Extraction] No structured items found for {chatbot_id} (not a product site?)", flush=True)
        except Exception as ext_err:
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
        except Exception:
            pass


async def train_chatbot_task(chatbot_id: str, website: str, limit: int = 10):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(executor, train_chatbot_sync, chatbot_id, website, limit)


def get_openai_response(prompt: str, model: str = OPENAI_MODEL) -> str:
    if not client:
        return "OpenAI API key not configured."
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"OpenAI error: {e}")
        return "Sorry, I couldn't generate a response."

def get_gemini_response(prompt: str) -> str:
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

    return "Sorry, all models are currently exhausted. Please try again in 1 minute."


def get_groq_response(prompt: str, model: str = GROQ_MODEL) -> str:
    if not groq_client:
        return "Groq API key not configured."
    try:
        completion = groq_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq error: {e}")
        return "Sorry, I couldn't generate a response."


def get_llm_response(prompt: str) -> str:
    if LLM_PROVIDER == "gemini":
        return get_gemini_response(prompt)
    if LLM_PROVIDER == "groq":
        return get_groq_response(prompt)
    return get_openai_response(prompt)


_PRICE_KEYWORDS = [
    "less than",
    "under",
    "below",
    "cheaper than",
    "affordable",
    "budget",
    "more than",
    "above",
    "over",
    "expensive",
    "premium",
    "between",
    "price range",
    "price",
    "show me",
    "list",
    "give me",
    "find me",
    "cheapest",
    "most expensive",
    "lowest price",
    "highest price",
    "what products",
    "what items",
    "what services",
    "sort by price",
    "order by price",
]


def _is_structured_query(query: str) -> bool:
    q = query.lower()
    return any(kw in q for kw in _PRICE_KEYWORDS)


def _parse_price_constraints(query: str):
    q = query.lower()
    min_price = max_price = None
    sort_asc = True

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
        raw_response = re.sub(r"```(?:json)?\s*", "", raw_response).strip().rstrip("`")
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


_PRONOUN_HINTS = [
    " he ",
    " she ",
    " it ",
    " they ",
    " them ",
    " his ",
    " her ",
    " its ",
    " their ",
    " this ",
    " that ",
    " these ",
    " those ",
    " the same ",
    "tell me more",
    "what about",
    "and ",
    "also ",
    "how about",
]


def _needs_rewrite(query: str) -> bool:
    q = " " + query.lower() + " "
    return any(hint in q for hint in _PRONOUN_HINTS)


async def ask_question(chatbot_id: str, query: str, history: List[dict] = []) -> str:
    loop = asyncio.get_event_loop()

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
            result = await loop.run_in_executor(executor, _query_structured_items, chatbot_id, constraints)
            return result or ""
        except Exception as e:
            print(f"[Router] SQL search error: {e}")
            return ""

    semantic_context, structured_context = await asyncio.gather(_pinecone_search(), _sql_search())

    prompt = _build_prompt(query, semantic_context, structured_context)
    prompt = clean_text(prompt)
    response = await loop.run_in_executor(executor, get_llm_response, prompt)
    return response.strip()


def _build_prompt(query: str, semantic_context: str, structured_context: str) -> str:
    if structured_context:
        supplement = f"\n\nAdditional website context:\n{semantic_context}" if semantic_context.strip() else ""
        return (
            "You are a helpful assistant for this business with access to the product catalog.\n\n"
            f"Customer question: {query}\n\n"
            f"Matching products from our catalog:\n{structured_context}{supplement}\n\n"
            "Instructions:\n"
            "- USE MARKDOWN formatting for your response.\n"
            "- Put every bullet point or item on a separate NEW LINE.\n"
            "- Dont use bolding for any (**item**) and for product names or key terms.\n"
            "- Only include products that satisfy the customer's filter.\n"
            "- If no products match exactly, say so honestly.\n"
            "- Be concise and friendly.\n\nResponse:"
        )
    if semantic_context.strip():
        return (
            "You are a helpful assistant trained on this business's website content.\n"
            "Answer only from the provided context. Be concise and factual.\n\n"
            "Formatting Rules:\n"
            "1. DON'T USE MARKDOWN (**bolding**, *italics*, etc.).\n"
            "2. If you are listing points, put each point on its own NEW LINE starting with a bullet point (>).\n\n"
            f"Context:\n{semantic_context}\n\nQuestion: {query}\nAnswer:"
        )
    return (
        f"You are a helpful assistant for this business. The customer asked: {query}\n"
        "You don't have enough information to answer this question yet. "
        "Apologize briefly and suggest they contact the business directly."
    )


def _stream_gemini(prompt: str):
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


def _stream_groq(prompt: str):
    if not groq_client:
        yield "Groq API key not configured."
        return
    try:
        stream = groq_client.chat.completions.create(
            model=GROQ_MODEL,
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
        print(f"Groq stream error: {e}")
        yield "Sorry, I couldn't generate a response."


def _stream_llm(prompt: str):
    if LLM_PROVIDER == "gemini":
        return _stream_gemini(prompt)
    if LLM_PROVIDER == "groq":
        return _stream_groq(prompt)
    return _stream_openai(prompt)