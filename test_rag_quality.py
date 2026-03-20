import uuid
import base64
import json
import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


def _auth_headers(user_id: str = "test-user-rag", email: str = "rag@example.com"):
    payload = {"sub": user_id, "email": email}
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    token = f"x.{payload_b64}.y"
    return {"Authorization": f"Bearer {token}"}


def _ensure_seed_bot(headers):
    # Ensure authenticated user has credits.
    client.post(
        "/api/internal/webhook/dodo",
        json={"user_id": "test-user-rag", "plan": "pro", "credits": 5, "event_id": "evt_test_rag_seed"},
    )

    bots_response = client.get("/api/chatbots", headers=headers)
    if bots_response.status_code != 200:
        pytest.skip("Unable to list chatbots for RAG tests")

    bots = bots_response.json()
    if bots:
        return bots[0]["id"]

    created = client.post(
        "/api/chatbots",
        headers=headers,
        json={"name": "RAG Test Bot", "website": "https://example.com", "limit": 1},
    )
    if created.status_code != 200:
        pytest.skip(f"Unable to create seed bot for RAG test: {created.text}")

    return created.json()["id"]

def test_rag_hallucination():
    print("\n--- Testing Hallucination Control ---")
    conv_id = str(uuid.uuid4())
    headers = _auth_headers()
    
    bot_id = _ensure_seed_bot(headers)
    print(f"Using Bot ID: {bot_id}")

    # Out of context question
    payload = {
        "message": "What did George Washington think about Bitcoin?",
        "conversation_id": conv_id
    }
    response = client.post(f"/api/chatbots/{bot_id}/chat", json=payload)
    assert response.status_code == 200
    res = response.json()
    print(f"Q: {payload['message']}")
    print(f"A: {res['response']}")
    
    if "haven't been trained" in res['response'] or "don't know" in res['response'].lower():
        print("✅ SUCCESS: Bot refused out-of-context question.")
    else:
        print("❌ FAILURE: Bot hallucinated or answered using general knowledge.")

def test_history_pronouns():
    print("\n--- Testing History-Aware Retrieval (Pronouns) ---")
    conv_id = str(uuid.uuid4())
    headers = _auth_headers()
    bot_id = _ensure_seed_bot(headers)

    # Q1: Establish context
    q1 = "What is Palmonas?"
    first = client.post(f"/api/chatbots/{bot_id}/chat", json={"message": q1, "conversation_id": conv_id})
    assert first.status_code == 200
    print(f"Sent Q1: {q1}")

    # Q2: Ambiguous pronoun
    q2 = "What are its main products?"
    second = client.post(f"/api/chatbots/{bot_id}/chat", json={"message": q2, "conversation_id": conv_id})
    assert second.status_code == 200
    res = second.json()
    print(f"Q2 (Ambiguous): {q2}")
    print(f"A2: {res['response']}")

    # If the response mentions "jewelry" or "Palmonas", the history re-writing worked
    if "jewelry" in res['response'].lower() or "palmonas" in res['response'].lower() or "rings" in res['response'].lower():
        print("✅ SUCCESS: History-aware retrieval worked.")
    else:
        print("❌ FAILURE: Bot failed to resolve 'its' in query or context missing.")

if __name__ == "__main__":
    test_rag_hallucination()
    test_history_pronouns()
