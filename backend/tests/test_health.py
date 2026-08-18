from fastapi.testclient import TestClient

from app.config import reset_settings_cache
from app.main import app, create_app


def test_health_returns_ok_and_mode():
    client = TestClient(app)
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["mode"] in {"MOCK", "LIVE"}
    assert payload["configured_mode"] in {"MOCK", "LIVE"}
    assert payload["provider"] in {"gemini", "openai"}
    assert isinstance(payload["model"], str) and payload["model"]


def test_health_reports_mock_when_live_provider_is_missing_key(monkeypatch):
    """[H-1] configured_mode=LIVE + no key must surface as effective mode=MOCK."""
    monkeypatch.setenv("MOCK_MODE", "false")
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    reset_settings_cache()

    try:
        payload = TestClient(create_app()).get("/api/health").json()
        assert payload["mode"] == "MOCK", "effective mode must flip to MOCK on missing key"
        assert payload["configured_mode"] == "LIVE"
        assert payload["provider"] == "gemini"
    finally:
        monkeypatch.delenv("MOCK_MODE", raising=False)
        monkeypatch.delenv("LLM_PROVIDER", raising=False)
        reset_settings_cache()


def test_health_reports_live_when_provider_and_key_are_set(monkeypatch):
    monkeypatch.setenv("MOCK_MODE", "false")
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key-for-test")
    reset_settings_cache()

    try:
        payload = TestClient(create_app()).get("/api/health").json()
        assert payload["mode"] == "LIVE"
        assert payload["configured_mode"] == "LIVE"
    finally:
        monkeypatch.delenv("MOCK_MODE", raising=False)
        monkeypatch.delenv("LLM_PROVIDER", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        reset_settings_cache()
