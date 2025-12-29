import requests

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
# -----------------------------
# Config
# -----------------------------
OLLAMA_URL = "http://localhost:11434/api/generate"

# -----------------------------
# Load documents
# -----------------------------
loader = TextLoader("text.txt")
documents = loader.load()

# -----------------------------
# Split documents
# -----------------------------
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)

chunks = splitter.split_documents(documents)

# -----------------------------
# Create vector store
# -----------------------------
embeddings = HuggingFaceEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2"
)
vectorstore = FAISS.from_documents(chunks, embeddings)

# -----------------------------
# Query
# -----------------------------
query = "Explain React hooks"

docs = vectorstore.similarity_search(query, k=4)

context = "\n\n".join(d.page_content for d in docs)

# -----------------------------
# Call Ollama (Phi-3)
# -----------------------------
prompt = f"""
Answer the question using ONLY the context below.
If the answer is not present, say "I don't know".

Context:
{context}

Question:
{query}
"""

payload = {
    "model": "phi3",
    "prompt": prompt,
    "stream": False
}

response = requests.post(OLLAMA_URL, json=payload)
response.raise_for_status()

answer = response.json()["response"]
print(answer)
