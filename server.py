"""FastAPI server to connect the chat interface with the LLM backend."""
import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import unicodedata
import re
from pinecone import Pinecone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# FastAPI app
app = FastAPI(title="Chat API", version="1.0.0")

# CORS - Allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "chatbot"
NAMESPACE = "__default__"

# Persistent HTTP session
session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504],
)
adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=10)
session.mount("http://", adapter)
session.mount("https://", adapter)

# Pinecone setup
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str | None = None

def ask_question(query: str) -> str:
    """Query Pinecone for context and send to Ollama for response."""
    # Search Pinecone for relevant context
    results = index.search(
        namespace=NAMESPACE,
        query={
            "top_k": 5,
            "inputs": {"text": query},
        },
    )

    context = "\n\n".join(
        hit["fields"]["chunk_text"]
        for hit in results.result.hits
    )

    # Build prompt with context
    if context.strip():
        prompt = f"""
Answer the question using the context below when relevant.
If the context doesn't help, use your general knowledge to answer.

Context:
{context}

Question:
{query}
"""
    else:
        prompt = f"""
Answer the following question using your knowledge:

Question:
{query}
"""
    prompt = unicodedata.normalize("NFKD", prompt)

    # Send to Ollama
    response = session.post(
        OLLAMA_URL,
        headers={"Content-Type": "application/json; charset=utf-8"},
        data=json.dumps(
            {
                "model": "phi3",
                "prompt": prompt,
                "stream": False,
            },
            ensure_ascii=False,
        ).encode("utf-8"),
        timeout=60,
    )

    response.raise_for_status()
    return response.json()["response"]


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "chat-api"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the LLM and get a response.
    
    This endpoint:
    1. Takes the user's message
    2. Queries Pinecone for relevant context (RAG)
    3. Sends the query + context to Ollama
    4. Returns the LLM response
    """
    try:
        response = ask_question(request.message)
        return ChatResponse(
            response=response,
            conversation_id=request.conversation_id
        )
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama. Make sure it's running (ollama serve)."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
