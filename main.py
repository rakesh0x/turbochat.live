import requests
import json
import unicodedata
import re
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter
from scraper.fetch_html import get_data

# ---------------- CONFIG ----------------
OLLAMA_URL = "http://localhost:11434/api/generate"
PINECONE_API_KEY = "pcsk_5XEa6s_5zWXSZxv36HYwDScEjD6jtsaPpYBTqgTYME6UiQxJhqQ3szkF2wTgJqL4ZGeaf5"
INDEX_NAME = "ragchatbot"
# ----------------------------------------

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Create index if it doesn't exist
if not pc.has_index(INDEX_NAME):
    pc.create_index_for_model(
        name=INDEX_NAME,
        cloud="aws",
        region="us-east-1",
        embed={
            "model": "text-embedding-3-small",
            "field_map": {"text": "chunk_text"},
        },
    )

index = pc.Index(INDEX_NAME)

# ---------------- INGESTION ----------------
url = "https://github.com/rakesh0x"
raw_text = get_data(url)

# Function to clean text for Pinecone (ASCII only)
def clean_text_for_pinecone(text: str) -> str:
    """
    Normalize text and remove non-ASCII characters to avoid Pinecone Unicode errors.
    """
    # Normalize Unicode
    text = unicodedata.normalize("NFKD", text)
    # Remove combining characters (accents)
    text = "".join(c for c in text if not unicodedata.combining(c))
    # Replace fancy quotes/dashes
    text = text.replace("’", "'").replace("‘", "'")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("–", "-").replace("—", "-")
    # Remove any remaining non-ASCII characters
    text = re.sub(r"[^\x00-\x7F]+", "", text)
    return text

# Split into chunks
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)
chunks = splitter.split_text(raw_text)
chunks = [clean_text_for_pinecone(chunk) for chunk in chunks]

# Upsert chunks to Pinecone
index.upsert_records(
    namespace="__default__",
    records=[
        {
            "_id": f"chunk-{i}",
            "chunk_text": chunk
        }
        for i, chunk in enumerate(chunks)
    ]
)

print(f"Inserted {len(chunks)} chunks into Pinecone")

# ---------------- QUERY ----------------
query = "What is Git?"

results = index.search(
    namespace="__default__",
    query={
        "top_k": 5,
        "inputs": {"text": query},
    },
)

# Extract context from Pinecone search results
context = "\n\n".join(
    match["fields"]["chunk_text"]
    for match in results["matches"]
)

# Build prompt for Ollama
prompt = f"""
Answer the question using ONLY the context below.
If the answer is not present, say "I don't know".

Context:
{context}

Question:
{query}
"""

# Normalize prompt for safety
utf_prompt = unicodedata.normalize("NFKD", prompt)

# Send to Ollama
response = requests.post(
    OLLAMA_URL,
    headers={"Content-Type": "application/json; charset=utf-8"},
    data=json.dumps(
        {
            "model": "phi3",
            "prompt": utf_prompt,
            "stream": False,
        },
        ensure_ascii=False,
    ).encode("utf-8"),
)

response.raise_for_status()

print("\n🤖 Answer:\n")
print(response.json()["response"])
