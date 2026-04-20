import asyncio
import json
import uuid
from datetime import datetime
from typing import List

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
    ask_question,
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


@router.get("/api/analytics")
async def get_analytics():
    return {
        "messagesOverTime": [
            {"date": "Feb 1", "messages": 120},
            {"date": "Feb 5", "messages": 450},
            {"date": "Feb 10", "messages": 380},
        ],
        "topQuestions": [
            {"question": "How do I sign up?", "count": 45},
            {"question": "What is the pricing?", "count": 32},
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

        response = await ask_question(chatbot_id, request.message, history)

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("UPDATE chatbots SET monthly_messages = monthly_messages + 1 WHERE id = %s", (chatbot_id,))
            cur.execute(
                "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chatbot_id, owner_user_id, "user", request.message, datetime.now().isoformat(), request.conversation_id),
            )
            cur.execute(
                "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (str(uuid.uuid4()), chatbot_id, owner_user_id, "assistant", response, datetime.now().isoformat(), request.conversation_id),
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

    async def event_generator():
        full_tokens: List[str] = []
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
                    "INSERT INTO messages (id, chatbot_id, user_id, role, content, timestamp, conversation_id) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s)",
                    (
                        str(uuid.uuid4()),
                        chatbot_id,
                        owner_user_id,
                        "assistant",
                        full_response,
                        datetime.now().isoformat(),
                        conversation_id,
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
