import requests

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from scraper.fetch_html import get_data
# -----------------------------
# Config
# -----------------------------
OLLAMA_URL = "http://localhost:11434/api/generate"

# -----------------------------
# Load documents
# -----------------------------
with open("output.txt", "w") as f:
    get_data("https://github.com/rakesh0x")

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
query = "how many public repositories are their in my github"

#store elements based on scores
docs_score = vectorstore.similarity_search_with_score(query, k=4)

#cosine similarity to compare distance 
def cosine_similarity(distance):
    return 1/(1 + distance)

#Thresholding filtering
SIMILARITY_THRESHOLD = 0.3
filtered_docs = []

for doc, distance in docs_score:
    distance = float(distance)
    similarity = 1 / (1 + distance)

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