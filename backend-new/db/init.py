"""Create fresh tables for backend-new (no legacy migrations)."""
from __future__ import annotations

from pathlib import Path

from . import get_conn, get_pool, release_conn

SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def init_db() -> None:
    # Ensure pool exists before connecting.
    get_pool()
    conn = get_conn()
    try:
        sql = SCHEMA_PATH.read_text()
        if not sql.strip():
            raise RuntimeError(f"{SCHEMA_PATH} is empty — define your tables first")
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
        print("backend-new tables initialized successfully.")
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


if __name__ == "__main__":
    init_db()
