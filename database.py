import sqlite3
import os
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "chatbot.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Chatbots table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chatbots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT NOT NULL,
        status TEXT NOT NULL,
        pages_scraped INTEGER DEFAULT 0,
        monthly_messages INTEGER DEFAULT 0,
        last_updated TEXT NOT NULL,
        created_at TEXT NOT NULL,
        model TEXT DEFAULT 'phi3',
        color TEXT
    )
    ''')
    
    # Messages/Conversations table (optional but good for persistence)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chatbot_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        conversation_id TEXT,
        FOREIGN KEY (chatbot_id) REFERENCES chatbots (id)
    )
    ''')
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
