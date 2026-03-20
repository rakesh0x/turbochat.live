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
                share_slug VARCHAR(255),
                is_public BOOLEAN NOT NULL DEFAULT FALSE,
                last_error TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        # Backfill/migrate legacy chatbots table structures.
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'training'")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS pages_scraped INT NOT NULL DEFAULT 0")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS monthly_messages INT NOT NULL DEFAULT 0")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS created_at TIMESTAMP")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS model VARCHAR(50) NOT NULL DEFAULT 'gpt-4o-mini'")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS color VARCHAR(50)")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS share_slug VARCHAR(255)")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE")
        cur.execute("ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS last_error TEXT")
        cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_chatbots_share_slug_unique ON chatbots (share_slug)")
        cur.execute(
            "INSERT INTO users (id, email, credits, plan) VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING",
            ("legacy-user", "legacy@local.invalid", 0, "free"),
        )
        cur.execute("UPDATE chatbots SET user_id = 'legacy-user' WHERE user_id IS NULL")
        cur.execute("UPDATE chatbots SET last_updated = NOW() WHERE last_updated IS NULL")
        cur.execute("UPDATE chatbots SET created_at = NOW() WHERE created_at IS NULL")
        cur.execute("ALTER TABLE chatbots ALTER COLUMN user_id SET NOT NULL")
        cur.execute("ALTER TABLE chatbots ALTER COLUMN last_updated SET NOT NULL")
        cur.execute("ALTER TABLE chatbots ALTER COLUMN created_at SET NOT NULL")

        # Ensure foreign key exists for chatbots.user_id even on legacy schema.
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'chatbots_user_id_fkey'
                ) THEN
                    ALTER TABLE chatbots
                    ADD CONSTRAINT chatbots_user_id_fkey
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
                END IF;
            END $$;
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

        # Backfill/migrate legacy messages table structures.
        cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)")
        cur.execute("ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(255)")

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