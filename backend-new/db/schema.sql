-- Fresh schema for backend-new. No legacy backfills.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chatbots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    website TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'training',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chunks (
    id SERIAL PRIMARY KEY,
    chatbot_id TEXT NOT NULL REFERENCES chatbots (id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    vector vector(1024) NOT NULL,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_chatbot ON chunks (chatbot_id);
