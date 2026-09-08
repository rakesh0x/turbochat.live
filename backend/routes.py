import asyncio
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from psycopg2.extras import RealDictCursor

from database import get_db_connection, release_db_connection

from .auth import get_current_user, is_active_free_trial
from .chat_engine import (
    _build_prompt,
    _is_structured_query,
    _needs_rewrite,
    _parse_price_constraints,
    _query_structured_items,
    _stream_llm,
    ask_question_with_meta,
    is_grounded,
    clean_text,
    is_crawl_error_text,
    make_share_slug,
    reserve_unique_share_slug,
    train_chatbot_task,
    get_llm_response,
)
from .config import (
    FREE_TRIAL_CHATBOT_LIMIT,
    FREE_TRIAL_SUPPORT_CHAT_LIMIT,
    OPENAI_MODEL,
    TEMP_DISABLE_CREDIT_BLOCKADE,
    executor,
    index,
)
from .schemas import (
    ChatbotCreate,
    ChatbotSchema,
    ChatRequest,
    ChatResponse,
    WebhookPayload,
)

router = APIRouter()


@router.get("/api/chatbots", response_model=List[ChatbotSchema])
async def list_chatbots(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM chatbots WHERE user_id = %s", (user["id"],))
        rows = cur.fetchall()
        cur.close()
    finally:
        release_db_connection(conn)

    active_trial = is_active_free_trial(user)
    remaining_free_trials = max(0, FREE_TRIAL_CHATBOT_LIMIT - len(rows)) if active_trial else 0

    return [
        ChatbotSchema(
            id=row["id"],
            name=row["name"],
            free_trial=remaining_free_trials,
            website=row["website"],
            status=row["status"],
            pagesScraped=row["pages_scraped"],
            monthlyMessages=row["monthly_messages"],
            lastUpdated=str(row["last_updated"]),
            createdAt=str(row["created_at"]),
            model=row["model"],
            color=row["color"],
            shareSlug=row.get("share_slug"),
            isPublic=bool(row.get("is_public", False)),
            trainingError=row.get("last_error"),
        )
        for row in rows
    ]


@router.post("/api/chatbots", response_model=ChatbotSchema)
async def create_chatbot(chatbot: ChatbotCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    chatbot_id = str(uuid.uuid4())
    now_dt = datetime.now()
    now = now_dt.isoformat()
    remaining_free_trials = int(user.get("free_trial_remaining", 0))

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        if not TEMP_DISABLE_CREDIT_BLOCKADE:
            cur.execute(
                "SELECT credits, plan, free_trial_remaining, free_trial_reset_at FROM users WHERE id = %s FOR UPDATE",
                (user["id"],),
            )
            usage_row = cur.fetchone()
            if not usage_row:
                raise HTTPException(status_code=404, detail="User not found")

            credits = int(usage_row.get("credits") or 0)
            plan = str(usage_row.get("plan") or "free").lower()
            reset_at = usage_row.get("free_trial_reset_at")

            if plan == "free":
                if not reset_at or reset_at <= now_dt:
                    cur.execute(
                        "UPDATE users SET free_trial_remaining = %s WHERE id = %s",
                        (0, user["id"]),
                    )
                    raise HTTPException(
                        status_code=402,
                        detail="Your 7-day free trial has ended. Subscribe to continue.",
                    )

                cur.execute("SELECT COUNT(*) AS total FROM chatbots WHERE user_id = %s", (user["id"],))
                chatbot_total = int(cur.fetchone()["total"])
                if chatbot_total >= FREE_TRIAL_CHATBOT_LIMIT:
                    raise HTTPException(
                        status_code=402,
                        detail=f"Free trial allows up to {FREE_TRIAL_CHATBOT_LIMIT} chatbots.",
                    )

                remaining_free_trials = max(0, FREE_TRIAL_CHATBOT_LIMIT - (chatbot_total + 1))
                cur.execute(
                    "UPDATE users SET free_trial_remaining = %s WHERE id = %s",
                    (remaining_free_trials, user["id"]),
                )
            elif credits > 0:
                cur.execute("UPDATE users SET credits = credits - 1 WHERE id = %s", (user["id"],))
            else:
                raise HTTPException(status_code=402, detail="Insufficient credits. Please upgrade your plan.")

        cur.execute(
            "INSERT INTO chatbots (id, user_id, name, website, status, last_updated, created_at, model) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (chatbot_id, user["id"], chatbot.name, chatbot.website, "training", now, now, OPENAI_MODEL),
        )
        conn.commit()
        cur.close()
    except HTTPException:
        conn.rollback()
        raise
    finally:
        release_db_connection(conn)

    background_tasks.add_task(train_chatbot_task, chatbot_id, chatbot.website, chatbot.limit or 10)

    return ChatbotSchema(
        id=chatbot_id,
        name=chatbot.name,
        free_trial=remaining_free_trials,
        website=chatbot.website,
        status="training",
        pagesScraped=0,
        monthlyMessages=0,
        lastUpdated=now,
        createdAt=now,
        model=OPENAI_MODEL,
        isPublic=False,
        trainingError=None,
    )


@router.get("/api/chatbots/{chatbot_id}/share")
async def get_chatbot_share(chatbot_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, share_slug, is_public FROM chatbots WHERE id = %s AND user_id = %s",
            (chatbot_id, user["id"]),
        )
        row = cur.fetchone()
        cur.close()
        if not row:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        return {
            "chatbotId": row["id"],
            "name": row["name"],
            "shareSlug": row["share_slug"],
            "isPublic": bool(row["is_public"]),
            "sharePath": f"/share/{row['share_slug']}" if row["share_slug"] else None,
        }
    finally:
        release_db_connection(conn)


@router.post("/api/chatbots/{chatbot_id}/share/publish")
async def publish_chatbot_share(chatbot_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, share_slug FROM chatbots WHERE id = %s AND user_id = %s",
            (chatbot_id, user["id"]),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Chatbot not found")

        share_slug = row["share_slug"]
        if not share_slug:
            base_slug = make_share_slug(row["name"], row["id"])
            share_slug = reserve_unique_share_slug(cur, base_slug)

        cur.execute(
            "UPDATE chatbots SET share_slug = %s, is_public = TRUE WHERE id = %s AND user_id = %s",
            (share_slug, chatbot_id, user["id"]),
        )
        conn.commit()
        cur.close()

        return {
            "status": "published",
            "chatbotId": chatbot_id,
            "shareSlug": share_slug,
            "sharePath": f"/share/{share_slug}",
            "isPublic": True,
        }
    except HTTPException:
        conn.rollback()
        raise
    finally:
        release_db_connection(conn)


@router.post("/api/chatbots/{chatbot_id}/share/unpublish")
async def unpublish_chatbot_share(chatbot_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "UPDATE chatbots SET is_public = FALSE WHERE id = %s AND user_id = %s RETURNING id, share_slug",
            (chatbot_id, user["id"]),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        conn.commit()
        cur.close()
        return {
            "status": "unpublished",
            "chatbotId": row["id"],
            "shareSlug": row["share_slug"],
            "isPublic": False,
        }
    except HTTPException:
        conn.rollback()
        raise
    finally:
        release_db_connection(conn)


@router.get("/api/public/chatbots/{share_slug}")
async def get_public_chatbot(share_slug: str):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, status, share_slug FROM chatbots WHERE share_slug = %s AND is_public = TRUE",
            (share_slug,),
        )
        row = cur.fetchone()
        cur.close()
        if not row:
            raise HTTPException(status_code=404, detail="Shared chatbot not found")

        return {
            "id": row["id"],
            "name": row["name"],
            "status": row["status"],
            "shareSlug": row["share_slug"],
        }
    finally:
        release_db_connection(conn)


@router.delete("/api/chatbots/{chatbot_id}")
async def delete_chatbot(chatbot_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM chatbots WHERE id = %s AND user_id = %s", (chatbot_id, user["id"]))
        conn.commit()
        cur.close()
    finally:
        release_db_connection(conn)
    try:
        index.delete(delete_all=True, namespace=chatbot_id)
    except Exception:
        pass
    return {"status": "success"}


@router.get("/api/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM chatbots WHERE user_id = %s", (user["id"],))
        total_chatbots = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(pages_scraped), 0) FROM chatbots WHERE user_id = %s", (user["id"],))
        total_pages = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(monthly_messages), 0) FROM chatbots WHERE user_id = %s", (user["id"],))
        total_messages = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM chatbots WHERE status = 'training' AND user_id = %s", (user["id"],))
        training_bots = cur.fetchone()[0]
        cur.close()
    finally:
        release_db_connection(conn)

    return {
        "totalChatbots": total_chatbots,
        "totalPages": total_pages,
        "totalMessages": total_messages,
        "trainingBots": training_bots,
        "activeBots": total_chatbots - training_bots,
    }


@router.post("/api/internal/webhook/dodo")
async def dodo_webhook_internal(payload: WebhookPayload):
    conn = get_db_connection()
    try:
        cur = conn.cursor()

        if payload.event_id:
            cur.execute("SELECT event_id FROM dodo_webhook_events WHERE event_id = %s", (payload.event_id,))
            existing = cur.fetchone()
            if existing:
                conn.commit()
                cur.close()
                return {"status": "ignored", "reason": "duplicate_event"}

        if not payload.user_id and not payload.user_email:
            raise HTTPException(status_code=400, detail="Missing user identifier")

        user_row = None
        if payload.user_id:
            cur.execute("SELECT id, email FROM users WHERE id = %s", (payload.user_id,))
            user_row = cur.fetchone()

        if not user_row and payload.user_email:
            cur.execute("SELECT id, email FROM users WHERE email = %s", (payload.user_email,))
            user_row = cur.fetchone()

        if user_row:
            target_user_id = user_row[0]
            cur.execute(
                "UPDATE users SET plan = %s, credits = credits + %s WHERE id = %s",
                (payload.plan, payload.credits, target_user_id),
            )
        else:
            generated_id = payload.user_id or str(uuid.uuid4())
            generated_email = payload.user_email or f"{generated_id}@unknown.local"
            cur.execute(
                "INSERT INTO users (id, email, credits, plan) VALUES (%s, %s, %s, %s)",
                (generated_id, generated_email, payload.credits, payload.plan),
            )

        if payload.event_id:
            cur.execute(
                "INSERT INTO dodo_webhook_events (event_id, processed_at) VALUES (%s, %s)",
                (payload.event_id, datetime.now().isoformat()),
            )

        conn.commit()
        cur.close()
        return {"status": "success"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        print(f"Internal webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
    finally:
        release_db_connection(conn)


@router.get("/api/users/me")
async def get_user_me(user: dict = Depends(get_current_user)):
    now_dt = datetime.now()
    active_trial = is_active_free_trial(user, now_dt)

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM chatbots WHERE user_id = %s", (user["id"],))
        total_chatbots = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM messages WHERE user_id = %s AND role = 'user'", (user["id"],))
        used_support_chats = cur.fetchone()[0]
        cur.close()
    finally:
        release_db_connection(conn)

    chatbot_remaining = max(0, FREE_TRIAL_CHATBOT_LIMIT - total_chatbots) if active_trial else 0
    support_chat_remaining = max(0, FREE_TRIAL_SUPPORT_CHAT_LIMIT - used_support_chats) if active_trial else 0

    return {
        "id": user["id"],
        "email": user["email"],
        "credits": user["credits"],
        "plan": user["plan"],
        "freeTrialRemaining": chatbot_remaining,
        "freeTrialResetAt": str(user.get("free_trial_reset_at")),
        "freeTrialActive": active_trial,
        "freeTrialSupportChatsRemaining": support_chat_remaining,
    }


# ---------------------------------------------------------------------------
# Analytics
#
# This replaced a hardcoded stub that returned three invented dates and two
# invented questions to every caller, unauthenticated. Everything below is
# counted from the `messages` table for the signed-in owner only, and anything
# that is not measured comes back as null so the dashboard can draw an em dash
# instead of a zero that looks like a real reading.
#
# `days` and `chatbotId` scope every figure in the response, so one filter row
# in the UI can drive the whole screen.
# ---------------------------------------------------------------------------

MAX_RANGE_DAYS = 90
# Bound as a query parameter, never interpolated, so `%` needs no escaping.
_EMAIL_RE = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"


def _clamp_days(days: int) -> int:
    try:
        value = int(days)
    except (TypeError, ValueError):
        return 30
    return max(1, min(MAX_RANGE_DAYS, value))


def _owned_chatbot_ids(cur, user_id: str, chatbot_id: Optional[str]) -> List[str]:
    """Never trust `chatbotId` from the query string — intersect it with ownership."""
    if chatbot_id:
        cur.execute(
            "SELECT id FROM chatbots WHERE user_id = %s AND id = %s",
            (user_id, chatbot_id),
        )
    else:
        cur.execute("SELECT id FROM chatbots WHERE user_id = %s", (user_id,))
    return [row["id"] for row in cur.fetchall()]


def _thread_key_sql(alias: str = "m") -> str:
    """A conversation is a thread within one chatbot.

    Rows written before the widget sent a session id have a NULL
    `conversation_id`; those count as one thread each rather than being silently
    merged into a single fake mega-conversation.
    """
    return f"({alias}.chatbot_id || ':' || COALESCE(NULLIF({alias}.conversation_id, ''), {alias}.id))"


@router.get("/api/analytics")
async def get_analytics(
    chatbotId: Optional[str] = None,
    days: int = 30,
    user: dict = Depends(get_current_user),
):
    window = _clamp_days(days)
    since = datetime.now() - timedelta(days=window - 1)
    since_day = since.replace(hour=0, minute=0, second=0, microsecond=0)

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        bot_ids = _owned_chatbot_ids(cur, user["id"], chatbotId)

        if not bot_ids:
            cur.close()
            return {
                "range": {"days": window, "from": since_day.isoformat()},
                "chatbotId": chatbotId,
                "totals": _empty_totals(),
                "messagesOverTime": [],
                "topQuestions": [],
                "unansweredQuestions": [],
                "byChatbot": [],
            }

        scope = (tuple(bot_ids), since_day)
        thread = _thread_key_sql()

        # Volume per day. Days with no traffic are filled in below rather than
        # dropped, so the chart does not compress a quiet week into a short line.
        cur.execute(
            f"""
            SELECT DATE(m.timestamp) AS day,
                   COUNT(*) FILTER (WHERE m.role = 'user') AS questions,
                   COUNT(DISTINCT {thread}) AS conversations
            FROM messages m
            WHERE m.chatbot_id IN %s AND m.timestamp >= %s
            GROUP BY DATE(m.timestamp)
            ORDER BY day
            """,
            scope,
        )
        by_day = {str(row["day"]): row for row in cur.fetchall()}

        series = []
        for offset in range(window):
            day = (since_day + timedelta(days=offset)).date()
            row = by_day.get(str(day))
            series.append(
                {
                    "date": day.isoformat(),
                    "messages": int(row["questions"]) if row else 0,
                    "conversations": int(row["conversations"]) if row else 0,
                }
            )

        # Totals. `answered`/`unanswered` count only rows where groundedness was
        # actually recorded; `unmeasured` is reported separately so the answer
        # rate is never diluted by history from before the column existed.
        cur.execute(
            f"""
            SELECT COUNT(*) FILTER (WHERE m.role = 'user') AS questions,
                   COUNT(*) FILTER (WHERE m.role = 'assistant') AS replies,
                   COUNT(DISTINCT {thread}) AS conversations,
                   COUNT(*) FILTER (WHERE m.role = 'assistant' AND m.grounded IS TRUE) AS answered,
                   COUNT(*) FILTER (WHERE m.role = 'assistant' AND m.grounded IS FALSE) AS unanswered,
                   COUNT(*) FILTER (WHERE m.role = 'assistant' AND m.grounded IS NULL) AS unmeasured,
                   COUNT(DISTINCT DATE(m.timestamp)) AS active_days,
                   PERCENTILE_CONT(0.5) WITHIN GROUP (
                       ORDER BY m.latency_ms
                   ) FILTER (WHERE m.latency_ms IS NOT NULL) AS median_latency,
                   MAX(m.timestamp) AS last_active
            FROM messages m
            WHERE m.chatbot_id IN %s AND m.timestamp >= %s
            """,
            scope,
        )
        agg = cur.fetchone() or {}

        answered = int(agg.get("answered") or 0)
        unanswered = int(agg.get("unanswered") or 0)
        measured = answered + unanswered
        median_latency = agg.get("median_latency")

        totals = {
            "messages": int(agg.get("questions") or 0),
            "replies": int(agg.get("replies") or 0),
            "conversations": int(agg.get("conversations") or 0),
            "answered": answered,
            "unanswered": unanswered,
            "unmeasured": int(agg.get("unmeasured") or 0),
            "answerRate": round(answered / measured, 4) if measured else None,
            "medianLatencyMs": int(median_latency) if median_latency is not None else None,
            "activeDays": int(agg.get("active_days") or 0),
            "lastActiveAt": str(agg["last_active"]) if agg.get("last_active") else None,
        }

        # What people ask, verbatim. Grouped case-insensitively but reported in
        # the wording that came up most, because the phrasing is the thing the
        # retrieval has to match.
        cur.execute(
            """
            SELECT MODE() WITHIN GROUP (ORDER BY m.content) AS question,
                   COUNT(*) AS count
            FROM messages m
            WHERE m.chatbot_id IN %s AND m.timestamp >= %s
              AND m.role = 'user' AND LENGTH(TRIM(m.content)) > 2
            GROUP BY LOWER(TRIM(m.content))
            ORDER BY count DESC, question ASC
            LIMIT 12
            """,
            scope,
        )
        top_questions = [
            {"question": row["question"], "count": int(row["count"])} for row in cur.fetchall()
        ]

        # Knowledge gaps: questions whose reply had no context behind it. This is
        # the one list on the whole dashboard that is directly actionable — every
        # row is a page the customer should add to the bot's knowledge.
        cur.execute(
            f"""
            SELECT MODE() WITHIN GROUP (ORDER BY q.content) AS question,
                   COUNT(*) AS count,
                   MAX(q.timestamp) AS last_asked,
                   MODE() WITHIN GROUP (ORDER BY q.chatbot_id) AS chatbot_id
            FROM messages q
            JOIN messages a
              ON a.chatbot_id = q.chatbot_id
             AND COALESCE(a.conversation_id, '') = COALESCE(q.conversation_id, '')
             AND a.role = 'assistant'
             AND a.grounded IS FALSE
             AND a.timestamp >= q.timestamp
             AND a.timestamp < q.timestamp + INTERVAL '2 minutes'
            WHERE q.chatbot_id IN %s AND q.timestamp >= %s AND q.role = 'user'
            GROUP BY LOWER(TRIM(q.content))
            ORDER BY count DESC, last_asked DESC
            LIMIT 12
            """,
            scope,
        )
        unanswered_questions = [
            {
                "question": row["question"],
                "count": int(row["count"]),
                "lastAskedAt": str(row["last_asked"]),
                "chatbotId": row["chatbot_id"],
            }
            for row in cur.fetchall()
        ]

        # Per-chatbot breakdown, so "which of these is carrying the load" is a
        # fact rather than a guess. Included even when a single bot is selected;
        # the caller decides whether to show it.
        cur.execute(
            f"""
            SELECT c.id, c.name,
                   COUNT(m.id) FILTER (WHERE m.role = 'user') AS questions,
                   COUNT(DISTINCT {thread}) AS conversations,
                   COUNT(m.id) FILTER (WHERE m.role = 'assistant' AND m.grounded IS TRUE) AS answered,
                   COUNT(m.id) FILTER (WHERE m.role = 'assistant' AND m.grounded IS FALSE) AS unanswered,
                   MAX(m.timestamp) AS last_active
            FROM chatbots c
            LEFT JOIN messages m
              ON m.chatbot_id = c.id AND m.timestamp >= %s
            WHERE c.id IN %s
            GROUP BY c.id, c.name
            ORDER BY questions DESC, c.name ASC
            """,
            (since_day, tuple(bot_ids)),
        )
        by_chatbot = []
        for row in cur.fetchall():
            bot_answered = int(row["answered"] or 0)
            bot_unanswered = int(row["unanswered"] or 0)
            bot_measured = bot_answered + bot_unanswered
            by_chatbot.append(
                {
                    "id": row["id"],
                    "name": row["name"],
                    "messages": int(row["questions"] or 0),
                    "conversations": int(row["conversations"] or 0),
                    "answered": bot_answered,
                    "unanswered": bot_unanswered,
                    "answerRate": round(bot_answered / bot_measured, 4) if bot_measured else None,
                    "lastActiveAt": str(row["last_active"]) if row["last_active"] else None,
                }
            )

        cur.close()
    finally:
        release_db_connection(conn)

    return {
        "range": {"days": window, "from": since_day.isoformat()},
        "chatbotId": chatbotId,
        "totals": totals,
        # `messagesOverTime` keeps its original key so existing readers of this
        # endpoint keep working; the series is real now.
        "messagesOverTime": series,
        "topQuestions": top_questions,
        "unansweredQuestions": unanswered_questions,
        "byChatbot": by_chatbot,
    }


def _empty_totals() -> dict:
    return {
        "messages": 0,
        "replies": 0,
        "conversations": 0,
        "answered": 0,
        "unanswered": 0,
        "unmeasured": 0,
        "answerRate": None,
        "medianLatencyMs": None,
        "activeDays": 0,
        "lastActiveAt": None,
    }


# ---------------------------------------------------------------------------
# Conversations
#
# The `messages` table already held every customer exchange; nothing in the
# product ever showed them. These two endpoints turn it into an inbox: a list
# grouped into threads, and one transcript.
#
# Both are scoped to the signed-in owner. The pre-existing
# /api/chatbots/{id}/conversation route takes a chatbot id straight from the URL
# with no auth dependency, which is fine for the public widget replaying its own
# session but is not something the console should read customer history through.
# ---------------------------------------------------------------------------


@router.get("/api/conversations")
async def list_conversations(
    chatbotId: Optional[str] = None,
    status: str = "all",
    days: int = 30,
    limit: int = 50,
    offset: int = 0,
    user: dict = Depends(get_current_user),
):
    window = _clamp_days(days)
    since_day = (datetime.now() - timedelta(days=window - 1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    page = max(1, min(200, int(limit or 50)))
    skip = max(0, int(offset or 0))

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        bot_ids = _owned_chatbot_ids(cur, user["id"], chatbotId)

        if not bot_ids:
            cur.close()
            return {
                "conversations": [],
                "counts": {"all": 0, "unanswered": 0, "contacts": 0},
                "hasMore": False,
            }

        thread = _thread_key_sql()

        # One row per thread, with the facts the list needs: what was asked
        # first, how long it ran, whether anything went unanswered, and whether
        # the visitor left a way to reach them.
        #
        # A "contact" is an email address the visitor typed into the chat. It is
        # detected, not collected — there is no lead form in the widget — so it
        # is labelled as what it is and never counted as a qualified lead.
        base = f"""
            SELECT {thread} AS thread_id,
                   MIN(m.chatbot_id) AS chatbot_id,
                   MIN(NULLIF(m.conversation_id, '')) AS conversation_id,
                   -- A thread with no session id is keyed by its own message
                   -- id, so this is the value the transcript endpoint can look
                   -- up. Without it the list would hand back the composite
                   -- thread key and every such row would 404.
                   MIN(m.id) AS first_message_id,
                   COUNT(*) AS messages,
                   MIN(m.timestamp) AS started_at,
                   MAX(m.timestamp) AS last_active_at,
                   BOOL_OR(m.role = 'assistant' AND m.grounded IS FALSE) AS has_unanswered,
                   MAX(CASE WHEN m.role = 'user' AND m.content ~* %s
                            THEN SUBSTRING(m.content FROM %s) END) AS contact_email,
                   (ARRAY_AGG(m.content ORDER BY m.timestamp ASC)
                       FILTER (WHERE m.role = 'user'))[1] AS opener
            FROM messages m
            WHERE m.chatbot_id IN %s AND m.timestamp >= %s
            GROUP BY {thread}
        """
        params: list = [_EMAIL_RE, _EMAIL_RE, tuple(bot_ids), since_day]

        having = ""
        if status == "unanswered":
            having = "HAVING BOOL_OR(m.role = 'assistant' AND m.grounded IS FALSE)"
        elif status == "contacts":
            having = "HAVING BOOL_OR(m.role = 'user' AND m.content ~* %s)"
            params.append(_EMAIL_RE)

        cur.execute(
            f"{base} {having} ORDER BY last_active_at DESC LIMIT %s OFFSET %s",
            tuple(params + [page + 1, skip]),
        )
        rows = cur.fetchall()
        has_more = len(rows) > page
        rows = rows[:page]

        names: dict = {}
        cur.execute("SELECT id, name FROM chatbots WHERE id IN %s", (tuple(bot_ids),))
        for row in cur.fetchall():
            names[row["id"]] = row["name"]

        # The tab counts, so switching filters never shows a number the list
        # then contradicts.
        cur.execute(
            f"""
            SELECT COUNT(*) AS all_threads,
                   COUNT(*) FILTER (WHERE t.has_unanswered) AS unanswered_threads,
                   COUNT(*) FILTER (WHERE t.contact_email IS NOT NULL) AS contact_threads
            FROM (
                SELECT BOOL_OR(m.role = 'assistant' AND m.grounded IS FALSE) AS has_unanswered,
                       MAX(CASE WHEN m.role = 'user' AND m.content ~* %s
                                THEN m.content END) AS contact_email
                FROM messages m
                WHERE m.chatbot_id IN %s AND m.timestamp >= %s
                GROUP BY {thread}
            ) t
            """,
            (_EMAIL_RE, tuple(bot_ids), since_day),
        )
        counts = cur.fetchone() or {}
        cur.close()
    finally:
        release_db_connection(conn)

    return {
        "conversations": [
            {
                "id": row["conversation_id"] or row["first_message_id"],
                "threadId": row["thread_id"],
                "chatbotId": row["chatbot_id"],
                "chatbotName": names.get(row["chatbot_id"]),
                "opener": (row["opener"] or "").strip() or None,
                "messages": int(row["messages"]),
                "startedAt": str(row["started_at"]),
                "lastActiveAt": str(row["last_active_at"]),
                "unanswered": bool(row["has_unanswered"]),
                "contactEmail": row["contact_email"],
            }
            for row in rows
        ],
        "counts": {
            "all": int(counts.get("all_threads") or 0),
            "unanswered": int(counts.get("unanswered_threads") or 0),
            "contacts": int(counts.get("contact_threads") or 0),
        },
        "hasMore": has_more,
    }


@router.get("/api/conversations/{conversation_id}")
async def get_conversation_transcript(
    conversation_id: str,
    chatbotId: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        bot_ids = _owned_chatbot_ids(cur, user["id"], chatbotId)
        if not bot_ids:
            cur.close()
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Threads with no session id are keyed by their own message id, so match
        # either form and let ownership do the filtering.
        cur.execute(
            """
            SELECT m.id, m.chatbot_id, m.role, m.content, m.timestamp, m.grounded, m.latency_ms
            FROM messages m
            WHERE m.chatbot_id IN %s
              AND (m.conversation_id = %s OR m.id = %s)
            ORDER BY m.timestamp ASC
            """,
            (tuple(bot_ids), conversation_id, conversation_id),
        )
        rows = cur.fetchall()
        cur.close()
    finally:
        release_db_connection(conn)

    if not rows:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {
        "id": conversation_id,
        "chatbotId": rows[0]["chatbot_id"],
        "startedAt": str(rows[0]["timestamp"]),
        "lastActiveAt": str(rows[-1]["timestamp"]),
        "messages": [
            {
                "id": row["id"],
                "role": row["role"],
                "content": row["content"],
                "timestamp": str(row["timestamp"]),
                "grounded": row["grounded"],
                "latencyMs": row["latency_ms"],
            }
            for row in rows
        ],
    }


@router.post("/api/chatbots/{chatbot_id}/chat", response_model=ChatResponse)
async def chat(chatbot_id: str, request: ChatRequest):
    try:
        print(f"Chat request for bot {chatbot_id}")

        now_dt = datetime.now()

        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT user_id FROM chatbots WHERE id = %s", (chatbot_id,))
            owner_row = cur.fetchone()
            cur.close()
            if not owner_row:
                raise HTTPException(status_code=404, detail="Chatbot not found")
            owner_user_id = owner_row["user_id"]
        finally:
            release_db_connection(conn)

        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT plan, free_trial_reset_at FROM users WHERE id = %s", (owner_user_id,))
            owner_usage = cur.fetchone()
            if not owner_usage:
                raise HTTPException(status_code=404, detail="Owner account not found")

            if is_active_free_trial(owner_usage, now_dt):
                cur.execute(
                    "SELECT COUNT(*) AS total FROM messages WHERE user_id = %s AND role = 'user'",
                    (owner_user_id,),
                )
                used_support_chats = int(cur.fetchone()["total"])
                if used_support_chats >= FREE_TRIAL_SUPPORT_CHAT_LIMIT:
                    raise HTTPException(
                        status_code=402,
                        detail=f"Free trial allows up to {FREE_TRIAL_SUPPORT_CHAT_LIMIT} support chats.",
                    )
            cur.close()
        finally:
            release_db_connection(conn)

        history = []
        if request.conversation_id:
            conn = get_db_connection()
            try:
                cur = conn.cursor(cursor_factory=RealDictCursor)
                cur.execute(
                    "SELECT role, content FROM messages WHERE chatbot_id = %s AND conversation_id = %s ORDER BY timestamp DESC LIMIT 5",
                    (chatbot_id, request.conversation_id),
                )
                rows = cur.fetchall()
                cur.close()
            finally:
                release_db_connection(conn)
            history = [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]

        answer = await ask_question_with_meta(chatbot_id, request.message, history)
        response = answer["response"]

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("UPDATE chatbots SET monthly_messages = monthly_messages + 1 WHERE id = %s", (chatbot_id,))
            cur.execute(
                "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chatbot_id, owner_user_id, "user", request.message, datetime.now().isoformat(), request.conversation_id),
            )
            cur.execute(
                "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id, grounded, latency_ms) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    str(uuid.uuid4()),
                    chatbot_id,
                    owner_user_id,
                    "assistant",
                    response,
                    datetime.now().isoformat(),
                    request.conversation_id,
                    answer["grounded"],
                    answer["latency_ms"],
                ),
            )
            conn.commit()
            cur.close()
        finally:
            release_db_connection(conn)

        return ChatResponse(
            response=response,
            conversation_id=request.conversation_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/chatbots/{chatbot_id}/chat/stream")
async def chat_stream(chatbot_id: str, request: ChatRequest):
    now_dt = datetime.now()

    async def _get_owner():
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT user_id FROM chatbots WHERE id = %s", (chatbot_id,))
            row = cur.fetchone()
            cur.close()
            return row
        finally:
            release_db_connection(conn)

    owner_row = await _get_owner()
    if not owner_row:
        async def _not_found():
            yield 'data: {"error": "Chatbot not found"}\n\n'

        return StreamingResponse(_not_found(), media_type="text/event-stream")

    owner_user_id = owner_row["user_id"]

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT plan, free_trial_reset_at FROM users WHERE id = %s", (owner_user_id,))
        owner_usage = cur.fetchone()
        if owner_usage and is_active_free_trial(owner_usage, now_dt):
            cur.execute(
                "SELECT COUNT(*) AS total FROM messages WHERE user_id = %s AND role = 'user'",
                (owner_user_id,),
            )
            used = int(cur.fetchone()["total"])
            if used >= FREE_TRIAL_SUPPORT_CHAT_LIMIT:
                cur.close()

                async def _limit():
                    yield 'data: {"error": "Free trial chat limit reached."}\n\n'

                return StreamingResponse(_limit(), media_type="text/event-stream")
        cur.close()
    finally:
        release_db_connection(conn)

    history: List[dict] = []
    if request.conversation_id:
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                "SELECT role, content FROM messages "
                "WHERE chatbot_id=%s AND conversation_id=%s ORDER BY timestamp DESC LIMIT 5",
                (chatbot_id, request.conversation_id),
            )
            rows = cur.fetchall()
            cur.close()
            history = [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]
        finally:
            release_db_connection(conn)

    loop = asyncio.get_event_loop()
    standalone_query = request.message
    if history and _needs_rewrite(request.message):
        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history[-3:]])
        rw_prompt = (
            "Rewrite as a standalone search query (replace pronouns). "
            "Output only the rewritten query.\n\n"
            f"History:\n{history_text}\nQuestion: {request.message}\nRewritten:"
        )
        try:
            standalone_query = await loop.run_in_executor(executor, get_llm_response, rw_prompt)
            standalone_query = standalone_query.strip().split("\n")[0].strip()
        except Exception:
            standalone_query = request.message

    async def _pinecone():
        try:
            results = await loop.run_in_executor(
                executor,
                lambda: index.search(
                    namespace=chatbot_id,
                    query={"top_k": 7, "inputs": {"text": standalone_query}},
                ),
            )
            return "\n\n".join(
                h["fields"]["chunk_text"]
                for h in results.result.hits
                if not is_crawl_error_text(h["fields"]["chunk_text"])
            )
        except Exception:
            return ""

    async def _sql():
        if not _is_structured_query(standalone_query):
            return ""
        try:
            c = _parse_price_constraints(standalone_query)
            r = await loop.run_in_executor(executor, _query_structured_items, chatbot_id, c)
            return r or ""
        except Exception:
            return ""

    semantic_ctx, structured_ctx = await asyncio.gather(_pinecone(), _sql())
    prompt = clean_text(_build_prompt(request.message, semantic_ctx, structured_ctx))

    conversation_id = request.conversation_id
    # Recorded now, while the context is still in scope. See `is_grounded`.
    grounded = is_grounded(semantic_ctx, structured_ctx)

    async def event_generator():
        full_tokens: List[str] = []
        started = time.perf_counter()
        try:
            token_queue: asyncio.Queue = asyncio.Queue()

            def _produce():
                try:
                    for token in _stream_llm(prompt):
                        loop.call_soon_threadsafe(token_queue.put_nowait, token)
                except Exception as err:
                    loop.call_soon_threadsafe(token_queue.put_nowait, Exception(str(err)))
                finally:
                    loop.call_soon_threadsafe(token_queue.put_nowait, None)

            loop.run_in_executor(executor, _produce)

            while True:
                item = await token_queue.get()
                if item is None:
                    break
                if isinstance(item, Exception):
                    yield f'data: {{"error": "{str(item)}"}}\n\n'
                    return
                full_tokens.append(item)
                payload = json.dumps({"token": item})
                yield f"data: {payload}\n\n"

        except Exception as gen_err:
            yield f'data: {{"error": "{gen_err}"}}\n\n'
            return

        full_response = "".join(full_tokens)
        try:
            conn2 = get_db_connection()
            try:
                cur2 = conn2.cursor()
                cur2.execute(
                    "UPDATE chatbots SET monthly_messages = monthly_messages + 1 WHERE id = %s",
                    (chatbot_id,),
                )
                cur2.execute(
                    "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (
                        str(uuid.uuid4()),
                        chatbot_id,
                        owner_user_id,
                        "user",
                        request.message,
                        datetime.now().isoformat(),
                        conversation_id,
                    ),
                )
                cur2.execute(
                    "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id, grounded, latency_ms) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        str(uuid.uuid4()),
                        chatbot_id,
                        owner_user_id,
                        "assistant",
                        full_response,
                        datetime.now().isoformat(),
                        conversation_id,
                        grounded,
                        int((time.perf_counter() - started) * 1000),
                    ),
                )
                conn2.commit()
                cur2.close()
            finally:
                release_db_connection(conn2)
        except Exception as db_err:
            print(f"[Stream] DB persist error: {db_err}")

        done_payload = json.dumps({"done": True, "conversation_id": conversation_id})
        yield f"data: {done_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/api/chatbots/{chatbot_id}/conversation")
async def get_conversation(chatbot_id: str, sessionId: str = "default"):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT * FROM messages WHERE chatbot_id = %s AND conversation_id = %s ORDER BY timestamp ASC",
            (chatbot_id, sessionId),
        )
        rows = cur.fetchall()
        cur.close()
    finally:
        release_db_connection(conn)

    return {
        "messages": [
            {"id": row["id"], "role": row["role"], "content": row["content"], "timestamp": str(row["timestamp"])}
            for row in rows
        ]
    }


@router.get("/health")
async def health():
    return {"status": "healthy"}
