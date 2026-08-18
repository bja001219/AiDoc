from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok_and_mode():
    client = TestClient(app)
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["mode"] in {"MOCK", "LIVE"}
    assert payload["provider"] in {"gemini", "openai"}
    assert isinstance(payload["model"], str) and payload["model"]
