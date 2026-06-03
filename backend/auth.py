import base64
import json
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from psycopg2.extras import RealDictCursor

from database import get_db_connection, release_db_connection

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = token.split(".")[1]
        payload += "=" * ((4 - len(payload) % 4) % 4)
        decoded = base64.urlsafe_b64decode(payload).decode("utf-8")
        user_data = json.loads(decoded)
        user_id = user_data["sub"]
        email = user_data.get("email", "")
    except Exception as e:
        print(f"JWT Decode Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token architecture")

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_row = cur.fetchone()

        if not user_row:
            cur.execute(
                "INSERT INTO users (id, email, credits, plan) VALUES (%s, %s, %s, %s) RETURNING *",
                (user_id, email, 0, "free"),
            )
            user_row = cur.fetchone()

        conn.commit()
        cur.close()
        return user_row
    except Exception as e:
        print(f"Auth DB Error: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail="Database error during authentication")
    finally:
        release_db_connection(conn)


def is_active_free_trial(user_row: dict, now_dt: Optional[datetime] = None) -> bool:
    now_dt = now_dt or datetime.now()
    plan = str(user_row.get("plan") or "free").lower()
    trial_ends_at = user_row.get("free_trial_reset_at")
    return plan == "free" and bool(trial_ends_at and trial_ends_at > now_dt)
