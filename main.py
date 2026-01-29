import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import unicodedata
import re
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter
from scraper.fetch_html import get_data

OLLAMA_URL = "http://localhost:11434/api/generate"
PINECONE_API_KEY = "pcsk_5XEa6s_5zWXSZxv36HYwDScEjD6jtsaPpYBTqgTYME6UiQxJhqQ3szkF2wTgJqL4ZGeaf5"
INDEX_NAME = "chatbot"

session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504],
)
adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=10, pool_maxsize=10)
session.mount("http://", adapter)
session.mount("https://", adapter)

pc = Pinecone(api_key=PINECONE_API_KEY)

if pc.has_index(INDEX_NAME):
    pc.delete_index(INDEX_NAME)

pc.create_index_for_model(
    name="chatbot",
    cloud="aws",
    region="us-east-1",
    embed={
        "model": "multilingual-e5-large",
        "field_map": {"text": "chunk_text"},
    },
)

index = pc.Index(INDEX_NAME)

url = "https://palmonas.com/"
raw_text = get_data(url)

def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.replace("’", "'").replace("‘", "'")
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("–", "-").replace("—", "-")
    text = re.sub(r"[^\x00-\x7F]+", "", text)
    return text

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)

chunks = splitter.split_text(raw_text)
chunks = [clean_text(chunk) for chunk in chunks]

BATCH_SIZE = 96
records = [
    {
        "_id": f"chunk-{i}",
        "chunk_text": chunk
    }
    for i, chunk in enumerate(chunks)
]

for i in range(0, len(records), BATCH_SIZE):
    batch = records[i:i + BATCH_SIZE]
    index.upsert_records(
        namespace="__default__",
        records=batch
    )

print(f"Inserted {len(chunks)} chunks into Pinecone")

def ask_question(query: str) -> str:
    """Query Pinecone and get answer from Ollama"""
    results = index.search(
        namespace="__default__",
        query={
            "top_k": 5,
            "inputs": {"text": query},
        },
    )

    context = "\n\n".join(
        hit["fields"]["chunk_text"]
        for hit in results.result.hits
    )

    prompt = f"""
Answer the question using ONLY the context below.
If the answer is not present, say "I don't know".

Context:
{context}

Question:
{query}
"""
    prompt = unicodedata.normalize("NFKD", prompt)

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

print("\n🤖 Chatbot ready! Type 'quit' to exit.\n")
while True:
    query = input("You: ").strip()
    if query.lower() in ("quit", "exit", "q"):
        print("Goodbye!")
        break
    if not query:
        continue
    try:
        answer = ask_question(query)
        print(f"\n🤖 Answer:\n{answer}\n")
    except requests.exceptions.ConnectionError:
        print("Cannot connect to Ollama. Make sure it's running (ollama serve).\n")
    except Exception as e:
        print(f"Error: {e}\n")