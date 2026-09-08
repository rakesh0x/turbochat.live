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

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("Qwen/Qwen3-Embedding-0.6B")
    return _model

def embedding_chunks(chunks: list[str]) -> list[list[float]]:
    model = get_model()
    return model.encode(chunks, normalize_embeddings=True).tolist() 