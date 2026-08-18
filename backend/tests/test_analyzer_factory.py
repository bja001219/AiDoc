"""Unit tests for the LLM provider factory ([M-3] in the senior review)."""
from __future__ import annotations

import pytest

from app.config import get_settings, reset_settings_cache
from app.services import analyzer_factory
from app.services.analyzer_factory import build_analyzer
from app.services.gemini_analyzer import GeminiAnalyzer
from app.services.mock_analyzer import MockAnalyzer
from app.services.openai_analyzer import OpenAIAnalyzer


@pytest.fixture(autouse=True)
def _reset(monkeypatch):
    # Clear both the settings cache and the SDK-client cache between cases so
    # env changes take effect and instances don't leak across tests.
    reset_settings_cache()
    analyzer_factory.reset_client_cache()
    for name in (
        "MOCK_MODE",
        "LLM_PROVIDER",
        "GEMINI_API_KEY",
        "OPENAI_API_KEY",
        "GEMINI_MODEL",
        "OPENAI_MODEL",
    ):
        monkeypatch.delenv(name, raising=False)
    yield
    reset_settings_cache()
    analyzer_factory.reset_client_cache()


def _load_settings(env: dict[str, str], monkeypatch):
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    reset_settings_cache()
    return get_settings()


def test_mock_mode_true_returns_mock_analyzer(monkeypatch):
    settings = _load_settings({"MOCK_MODE": "true"}, monkeypatch)
    assert isinstance(build_analyzer(settings), MockAnalyzer)


def test_gemini_without_key_falls_back_to_mock(monkeypatch, caplog):
    settings = _load_settings(
        {"MOCK_MODE": "false", "LLM_PROVIDER": "gemini"}, monkeypatch,
    )
    with caplog.at_level("WARNING", logger="app.services.analyzer_factory"):
        analyzer = build_analyzer(settings)
    assert isinstance(analyzer, MockAnalyzer)
    assert any("GEMINI_API_KEY" in r.message for r in caplog.records), (
        "operator must see a WARNING when the live provider silently degrades"
    )


def test_openai_without_key_falls_back_to_mock(monkeypatch, caplog):
    settings = _load_settings(
        {"MOCK_MODE": "false", "LLM_PROVIDER": "openai"}, monkeypatch,
    )
    with caplog.at_level("WARNING", logger="app.services.analyzer_factory"):
        analyzer = build_analyzer(settings)
    assert isinstance(analyzer, MockAnalyzer)
    assert any("OPENAI_API_KEY" in r.message for r in caplog.records)


def test_gemini_with_key_returns_gemini_analyzer(monkeypatch):
    settings = _load_settings(
        {
            "MOCK_MODE": "false",
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": "test-key",
            "GEMINI_MODEL": "gemini-3.6-flash",
        },
        monkeypatch,
    )
    analyzer = build_analyzer(settings)
    assert isinstance(analyzer, GeminiAnalyzer)


def test_openai_with_key_returns_openai_analyzer(monkeypatch):
    settings = _load_settings(
        {
            "MOCK_MODE": "false",
            "LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-test",
            "OPENAI_MODEL": "gpt-4o-mini",
        },
        monkeypatch,
    )
    analyzer = build_analyzer(settings)
    assert isinstance(analyzer, OpenAIAnalyzer)


def test_gemini_client_is_cached_per_key(monkeypatch):
    """[H-2] Same key must reuse the SDK client across build_analyzer calls."""
    settings = _load_settings(
        {
            "MOCK_MODE": "false",
            "LLM_PROVIDER": "gemini",
            "GEMINI_API_KEY": "cache-key-1",
        },
        monkeypatch,
    )
    a = build_analyzer(settings)
    b = build_analyzer(settings)
    assert isinstance(a, GeminiAnalyzer)
    assert isinstance(b, GeminiAnalyzer)
    # Same underlying client is reused; wrappers may differ but the expensive
    # SDK client (TLS/session state) must be shared.
    assert a._client is b._client  # noqa: SLF001 — internal probe for cache


def test_openai_client_is_cached_per_key(monkeypatch):
    settings = _load_settings(
        {
            "MOCK_MODE": "false",
            "LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-cache-1",
        },
        monkeypatch,
    )
    a = build_analyzer(settings)
    b = build_analyzer(settings)
    assert a._client is b._client  # noqa: SLF001
