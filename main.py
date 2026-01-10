import requests
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from scraper.fetch_html import get_data

OLLAMA_URL = "http://localhost:11434/api/generate"

# -----------------------------
# Fetch + save data
# -----------------------------
data = get_data("https://github.com/rakesh0x")

with open("output.txt", "w", encoding="utf-8") as f:
    f.write(data)

# -----------------------------
# Load documents
# -----------------------------
loader = TextLoader("output.txt")
documents = loader.load()

# -----------------------------
# Split documents
# -----------------------------
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)
chunks = splitter.split_documents(documents)

if not chunks:
    print("I don't know (no content to index)")
    exit()

# -----------------------------
# Vector store
# -----------------------------
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
vectorstore = FAISS.from_documents(chunks, embeddings)

# -----------------------------
# Query
# -----------------------------
query = "what is git"

docs_score = vectorstore.similarity_search_with_score(query, k=4)

SIMILARITY_THRESHOLD = 0.3
filtered_docs = []

for doc, distance in docs_score:
    similarity = 1 / (1 + float(distance))
    if similarity >= SIMILARITY_THRESHOLD:
        filtered_docs.append((doc, similarity))

if not filtered_docs:
    print("I don't know")
    exit()

context = "\n\n".join(
    f"[score: {score:.2f}]\n{doc.page_content}"
    for doc, score in filtered_docs
)

# -----------------------------
# Ollama
# -----------------------------
prompt = f"""
Answer the question using ONLY the context below.
If the answer is not present, say "I don't know".

Context:
{context}:

Question:
{query}
"""

response = requests.post(
    OLLAMA_URL,
    json={"model": "phi3", "prompt": prompt, "stream": False}
)
response.raise_for_status()

print(response.json()["response"]
