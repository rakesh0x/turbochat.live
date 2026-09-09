"""Hybrid query engine.

Combines dense and sparse retrieval, deduplicates candidates, applies a
lightweight ranker, then a heavy cross-encoder reranker. Designed for
production reliability and scalability.
"""

import asyncio
import json
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from scrapper.crawler import main as crawl_site
import psycopg2
from langchain.vectorstores.pgvector import PGVector


# i did the ingestion pipeline where
async def ingest(url: str, limit: int = 10) -> str:
    text = await crawl_site(url, limit)
    return text

#chunk before embeddings i,e dense and sparse retrieval
def split_text(text: str) -> list[str]:
    """Split text into chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        length_function=len,
    )

    chunks = splitter.split_text(text)
    return chunks

_model = None

# get the model to perform embeddings
def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("Qwen/Qwen3-Embedding-0.6B")
    return _model

# embed the chunks using the model
def embedding_chunks(chunks: list[str]) -> list[list[float]]:
    model = get_model()
    return model.encode(chunks, normalize_embeddings=True).tolist() 

# next is to store these chunks in db 
def store_chunks(chunks: list[str], embeddings: list[list[float]]) -> None:
    conn = psycopg2.connect()

    try:
        for chunk in zip(f"embeddings, chunks"): 
            push_embeddings_to_db = PGVector.from_document(
                embeddings=embeddings,
                documents=chunks,
                collection_name="turbochat_vectors",
                connection_string=conn
            )
    except RuntimeError as E:
        print(f"embeddings failed")

#--- Retreival system for query using efficient methods -----#
def rrf(dense_ids, sparse_ids, k=60):
    scores = {}
    for c, cid in enumerate(dense_ids):
        scores[cid] = scores.get(cid, 0) + 1/ (k+c+1)
    for c, cid in enumerate(sparse_ids):
        scores[cid] = scores.get(cid, 0) + 1/ (k+c+1)
    return sorted(scores, key=lambda cid: scores[cid], reverse=True)