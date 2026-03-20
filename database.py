import os
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv('DATABASE_URL')

# Connection pool (min 1 connection, max 10)
pool = SimpleConnectionPool(1, 10, database_url)


def get_db_connection():
    """Get a connection from the pool with RealDictCursor factory."""
    conn = pool.getconn()
    conn.autocommit = False
    return conn

def release_db_connection(conn):
    """Return a connection to the pool."""
    pool.putconn(conn)


def close_pool():
    """Close all connections in the pool."""
    pool.closeall()


def init_db():
    """Create tables if they don't exist."""
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                credits INT NOT NULL DEFAULT 0,
                plan VARCHAR(50) NOT NULL DEFAULT 'free'
            )
        """)

        # Chatbots table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS chatbots (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                website VARCHAR(500) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'training',
                pages_scraped INT NOT NULL DEFAULT 0,
                monthly_messages INT NOT NULL DEFAULT 0,
                last_updated TIMESTAMP NOT NULL,
                created_at TIMESTAMP NOT NULL,
                model VARCHAR(50) NOT NULL DEFAULT 'gpt-4o-mini',
                color VARCHAR(50),
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        # Messages table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id VARCHAR(255) PRIMARY KEY,
                chatbot_id VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                conversation_id VARCHAR(255),
                FOREIGN KEY (chatbot_id) REFERENCES chatbots (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        # Dodo webhook events table (idempotency)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS dodo_webhook_events (
                event_id VARCHAR(255) PRIMARY KEY,
                processed_at TIMESTAMP NOT NULL
            )
        """)

        conn.commit()
        cur.close()
        print("Database tables initialized successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error initializing database: {e}")
        raise
    finally:
        release_db_connection(conn)


if __name__ == "__main__":
    init_db()