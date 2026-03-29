import pytest
from fastapi.testclient import TestClient
from server import app
from database import get_db_connection, release_db_connection
import base64
import json
from datetime import datetime, timedelta

client = TestClient(app)


def _auth_headers(user_id: str = "test-user-1", email: str = "test@example.com"):
    payload = {"sub": user_id, "email": email}
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    token = f"x.{payload_b64}.y"
    return {"Authorization": f"Bearer {token}"}


def _set_user_usage_state(user_id: str, credits: int, free_trials: int, reset_at: datetime):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE users
            SET credits = %s,
                free_trial_remaining = %s,
                free_trial_reset_at = %s
            WHERE id = %s
            """,
            (credits, free_trials, reset_at.isoformat(), user_id),
        )
        conn.commit()
        cur.close()
    finally:
        release_db_connection(conn)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_list_chatbots():
    response = client.get("/api/chatbots", headers=_auth_headers())
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_stats():
    response = client.get("/api/stats", headers=_auth_headers())
    assert response.status_code == 200
    assert "totalChatbots" in response.json()

def test_create_chatbot():
    # Mocking background tasks is a bit complex, but we can check if it returns 200
    # and adds to the database.
    payload = {
        "name": "Test Bot",
        "website": "https://example.com"
    }

    headers = _auth_headers()

    # Seed credits for authenticated test user to satisfy credit-gated chatbot creation.
    seed_res = client.post(
        "/api/internal/webhook/dodo",
        json={"user_id": "test-user-1", "plan": "pro", "credits": 5, "event_id": "evt_test_backend_1"},
    )
    assert seed_res.status_code == 200

    response = client.post("/api/chatbots", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Bot"
    assert data["status"] == "training"
    
    # Cleanup
    chatbot_id = data["id"]
    client.delete(f"/api/chatbots/{chatbot_id}", headers=headers)


def test_create_chatbot_uses_free_trial_when_no_credits():
    user_id = "test-user-free-trial"
    headers = _auth_headers(user_id=user_id, email="free-trial@example.com")

    create_user_res = client.get("/api/users/me", headers=headers)
    assert create_user_res.status_code == 200

    _set_user_usage_state(
        user_id=user_id,
        credits=0,
        free_trials=2,
        reset_at=datetime.now() + timedelta(days=2),
    )

    payload = {"name": "Trial Bot", "website": "https://example.com"}
    response = client.post("/api/chatbots", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["free_trial"] == 1

    me_res = client.get("/api/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["freeTrialRemaining"] == 1

    client.delete(f"/api/chatbots/{data['id']}", headers=headers)


def test_create_chatbot_blocks_when_credits_and_trial_exhausted():
    user_id = "test-user-no-credit-no-trial"
    headers = _auth_headers(user_id=user_id, email="no-trial@example.com")

    create_user_res = client.get("/api/users/me", headers=headers)
    assert create_user_res.status_code == 200

    _set_user_usage_state(
        user_id=user_id,
        credits=0,
        free_trials=0,
        reset_at=datetime.now() - timedelta(days=1),
    )

    payload = {"name": "Blocked Bot", "website": "https://example.com"}
    response = client.post("/api/chatbots", json=payload, headers=headers)
    assert response.status_code == 402


def test_create_chatbot_blocks_after_two_free_trial_chatbots():
    user_id = "test-user-two-chatbot-limit"
    headers = _auth_headers(user_id=user_id, email="two-limit@example.com")

    create_user_res = client.get("/api/users/me", headers=headers)
    assert create_user_res.status_code == 200

    _set_user_usage_state(
        user_id=user_id,
        credits=0,
        free_trials=2,
        reset_at=datetime.now() + timedelta(days=2),
    )

    first = client.post("/api/chatbots", json={"name": "Bot One", "website": "https://example.com"}, headers=headers)
    second = client.post("/api/chatbots", json={"name": "Bot Two", "website": "https://example.com"}, headers=headers)
    third = client.post("/api/chatbots", json={"name": "Bot Three", "website": "https://example.com"}, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert third.status_code == 402

    for created in [first, second]:
        client.delete(f"/api/chatbots/{created.json()['id']}", headers=headers)


def test_chat_blocks_after_fifteen_trial_support_chats(monkeypatch):
    user_id = "test-user-support-chat-limit"
    headers = _auth_headers(user_id=user_id, email="support-limit@example.com")

    create_user_res = client.get("/api/users/me", headers=headers)
    assert create_user_res.status_code == 200

    _set_user_usage_state(
        user_id=user_id,
        credits=0,
        free_trials=2,
        reset_at=datetime.now() + timedelta(days=2),
    )

    async def _fake_ask_question(chatbot_id, query, history=None):
        return "ok"

    monkeypatch.setattr("server.ask_question", _fake_ask_question)

    bot_res = client.post(
        "/api/chatbots",
        json={"name": "Support Bot", "website": "https://example.com"},
        headers=headers,
    )
    assert bot_res.status_code == 200
    chatbot_id = bot_res.json()["id"]

    for i in range(15):
        res = client.post(
            f"/api/chatbots/{chatbot_id}/chat",
            json={"message": f"Message {i+1}", "conversation_id": "support-limit"},
            headers=headers,
        )
        assert res.status_code == 200

    blocked_res = client.post(
        f"/api/chatbots/{chatbot_id}/chat",
        json={"message": "Message 16", "conversation_id": "support-limit"},
        headers=headers,
    )
    assert blocked_res.status_code == 402

    client.delete(f"/api/chatbots/{chatbot_id}", headers=headers)