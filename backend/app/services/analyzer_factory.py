from __future__ import annotations

import logging
from typing import Any

from app.config import Settings
from app.services.analyzer_base import Analyzer
from app.services.mock_analyzer import MockAnalyzer

logger = logging.getLogger(__name__)

# Total request-response budget for a live LLM call. Bumped high enough to
# absorb a slow Gemini answer on a large RFP; short enough that a hung
# request doesn't wedge the process forever.
LIVE_TIMEOUT_SECONDS = 90

_MOCK_ANALYZER = MockAnalyzer()
_gemini_client_cache: dict[str, Any] = {}
_openai_client_cache: dict[str, Any] = {}


def reset_client_cache() -> None:
    """Test helper to clear cached SDK clients (e.g. after a key rotation)."""
    _gemini_client_cache.clear()
    _openai_client_cache.clear()


def _get_gemini_client(api_key: str) -> Any | None:
    """Return a cached google-genai client for the given key, or None if the
    SDK is unavailable."""
    if api_key in _gemini_client_cache:
        return _gemini_client_cache[api_key]
    try:
        from google import genai
    except ImportError:
        logger.warning(
            "LLM_PROVIDER=gemini but google-genai is not installed; "
            "falling back to MockAnalyzer.",
        )
        return None
    # http_options timeout is in milliseconds. Passing as a dict keeps us off
    # google.genai.types imports; the SDK normalises it internally.
    client = genai.Client(
        api_key=api_key,
        http_options={"timeout": LIVE_TIMEOUT_SECONDS * 1000},
    )
    _gemini_client_cache[api_key] = client
    return client


def _get_openai_client(api_key: str) -> Any | None:
    if api_key in _openai_client_cache:
        return _openai_client_cache[api_key]
    try:
        from openai import OpenAI
    except ImportError:
        logger.warning(
            "LLM_PROVIDER=openai but openai SDK is not installed; "
            "falling back to MockAnalyzer.",
        )
        return None
    # OpenAI SDK takes seconds (float) at client init; propagates as httpx
    # timeout on every request.
    client = OpenAI(api_key=api_key, timeout=float(LIVE_TIMEOUT_SECONDS))
    _openai_client_cache[api_key] = client
    return client


def build_analyzer(settings: Settings) -> Analyzer:
    """Return the Analyzer that should serve the current request.

    Falls back to MockAnalyzer whenever the configured live provider is
    unavailable (missing key or missing SDK). Every fallback path logs a
    WARNING so an operator can tell the demo apart from a broken deploy.
    SDK clients are cached per api_key to avoid a TLS handshake per request.
    """
    if settings.mock_mode:
        return _MOCK_ANALYZER

    if settings.llm_provider == "gemini":
        if not settings.gemini_api_key:
            logger.warning(
                "LLM_PROVIDER=gemini but GEMINI_API_KEY is empty; "
                "falling back to MockAnalyzer.",
            )
            return _MOCK_ANALYZER
        client = _get_gemini_client(settings.gemini_api_key)
        if client is None:
            return _MOCK_ANALYZER
        from app.services.gemini_analyzer import GeminiAnalyzer

        return GeminiAnalyzer(client=client, model=settings.gemini_model)

    # openai
    if not settings.openai_api_key:
        logger.warning(
            "LLM_PROVIDER=openai but OPENAI_API_KEY is empty; "
            "falling back to MockAnalyzer.",
        )
        return _MOCK_ANALYZER
    client = _get_openai_client(settings.openai_api_key)
    if client is None:
        return _MOCK_ANALYZER
    from app.services.openai_analyzer import OpenAIAnalyzer

    return OpenAIAnalyzer(client=client, model=settings.openai_model)
