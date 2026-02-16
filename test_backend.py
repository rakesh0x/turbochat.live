import pytest
from fastapi.testclient import TestClient
from server import app
import os
import sqlite3

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_list_chatbots():
    response = client.get("/api/chatbots")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_stats():
    response = client.get("/api/stats")
    assert response.status_code == 200
    assert "totalChatbots" in response.json()

def test_create_chatbot():
    # Mocking background tasks is a bit complex, but we can check if it returns 200
    # and adds to the database.
    payload = {
        "name": "Test Bot",
        "website": "https://example.com"
    }
    response = client.post("/api/chatbots", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Bot"
    assert data["status"] == "training"
    
    # Cleanup
    chatbot_id = data["id"]
    client.delete(f"/api/chatbots/{chatbot_id}")
