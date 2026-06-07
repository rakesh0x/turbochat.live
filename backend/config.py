import os
from concurrent.futures import ThreadPoolExecutor

import google.generativeai as genai
from dotenv import load_dotenv
from openai import OpenAI
from pinecone import Pinecone

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("PINECONE_INDEX", "chatbot")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODELS = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-flash-8b"]

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
TEMP_DISABLE_CREDIT_BLOCKADE = os.getenv("TEMP_DISABLE_CREDIT_BLOCKADE", "false").lower() == "true"

FREE_TRIAL_DAYS = 7
FREE_TRIAL_CHATBOT_LIMIT = 2
FREE_TRIAL_SUPPORT_CHAT_LIMIT = 15

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

groq_client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
) if GROQ_API_KEY else None

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

executor = ThreadPoolExecutor(max_workers=10)
