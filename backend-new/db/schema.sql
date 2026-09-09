-- Fresh schema for backend-new. No legacy backfills.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free',
    credits INT NOT NULL DEFAULT 0,
    free_trial_remaining INT NOT NULL DEFAULT 2,
    free_trial_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatbots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
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

SELECT id, text, source, vector <==> %s AS dist
FROM chunks WHERE chatbot_id = %s
ORDER BY dist ASC LIMIT 50;

SELECT id, text, source, ts_rank_cd(fts, q) AS rank
FROM chunks, plain_to_tsquery("english", %s) AS q
WHERE chatbot_id = %s AND fts @@ q
ORDER BY rank DESC LIMIT 50;

ALTER TABLE chunks ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;
CREATE INDEX idx_chunks_fts ON chunks USING GIN (fts);
CREATE INDEX idx_chunks_vec ON chunks USING hnsw(vector vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_chunks_chatbot ON chunks (chatbot_id);