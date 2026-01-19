import requests
import os
from dotenv import load_dotenv, dotenv_values
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from scraper.fetch_html import get_data
from pinecone import Pinecone

OLLAMA_URL = "http://localhost:11434/api/generate"
pc = Pinecone(api_key="pcsk_27M6Rz_CvMfnWXnu3dKXoNHTHksNbXqXHkDAuHYVa67C7zu5YVdVrSXDaeBeDNWvJNKNf7")

data = get_data("https://github.com/rakesh0x")

index_name = "ragchatbot"

if not pc.has_index(index_name):
    pc.create_index_for_model(:
        name=index_name,
        cloud="aws",
        region="us-east-1",
        embed={
            "model": "text-embedding-3-small",
            "field_map":{"text": "chunk_text"}
        }
    )

query = "what is git"

results = index.search(
    namespace="ns1",
    query={
        "top_k": 5,
        "inputs": {
            'text': query
        }
    }
)

print(result)

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

print(response.json()["response"])
