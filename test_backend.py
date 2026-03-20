import pytest
from fastapi.testclient import TestClient
from server import app
import base64
import json

client = TestClient(app)


def _auth_headers(user_id: str = "test-user-1", email: str = "test@example.com"):
    payload = {"sub": user_id, "email": email}
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    token = f"x.{payload_b64}.y"
    return {"Authorization": f"Bearer {token}"}

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
