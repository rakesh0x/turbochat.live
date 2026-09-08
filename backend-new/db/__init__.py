import os

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

load_dotenv()

_pool: SimpleConnectionPool | None = None


def get_pool() -> SimpleConnectionPool:
    """Return the global pool, creating it on first use."""
    global _pool
    if _pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError("DATABASE_URL is not set")
        _pool = SimpleConnectionPool(1, 10, database_url)
    return _pool


def get_conn():
    """Checkout a connection from the pool (caller must release it)."""
    conn = get_pool().getconn()
    conn.autocommit = False
    return conn


def release_conn(conn) -> None:
    """Return a connection to the pool."""
    if _pool is not None and conn is not None:
        _pool.putconn(conn)


def close_pool() -> None:
    """Close all pooled connections."""
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None
