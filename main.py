import requests
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter
from scraper.fetch_html import get_data


OLLAMA_URL = "http://localhost:11434/api/generate"
PINECONE_API_KEY = "pcsk_5XEa6s_5zWXSZxv36HYwDScEjD6jtsaPpYBTqgTYME6UiQxJhqQ3szkF2wTgJqL4ZGeaf5"
INDEX_NAME = "ragchatbot"


pc = Pinecone(api_key=PINECONE_API_KEY)

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

url = "https://github.com/rakesh0x"
raw_text = get_data(url)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)

chunks = splitter.split_text(raw_text)

index.upsert(
    records=[
        {
            "id": f"chunk-{i}",
            "metadata": {"chunk_text": chunk},
        }
        for i, chunk in enumerate(chunks)
    ],
    namespace="default", vectors=""
)

print(f"Inserted {len(chunks)} chunks into Pinecone")


query = "What is Git?"

results = index.search(
    namespace=NAMESPACE,
    query={
        "top_k": 5,
        "inputs": {"text": query},
    },
)

# Extract context
context = "\n\n".join(
    match["metadata"]["chunk_text"]
    for match in results["matches"]
)


prompt = f"""
Answer the question using ONLY the context below.
If the answer is not present, say "I don't know".

Context:
{context}

Question:
{query}
"""

response = requests.post(
    OLLAMA_URL,
    json={
        "model": "phi3",
        "prompt": prompt,
        "stream": False,
    },
)

response.raise_for_status()

print("\n🤖 Answer:\n")
print(response.json()["response"])
