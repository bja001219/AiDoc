from __future__ import annotations

from app.config import Settings
from app.services.analyzer_base import Analyzer
from app.services.mock_analyzer import MockAnalyzer


def build_analyzer(settings: Settings) -> Analyzer:
    """Return an Analyzer that matches the current settings.

    Falls back to MockAnalyzer whenever the configured live provider is
    unavailable (missing key or missing SDK). Mock 모드가 아니라도 프로바이더
    키가 없으면 mock 으로 안전하게 되돌린다.
    """
    if settings.mock_mode:
        return MockAnalyzer()

    if settings.llm_provider == "gemini":
        if not settings.gemini_api_key:
            return MockAnalyzer()
        try:
            from google import genai
        except ImportError:
            return MockAnalyzer()
        from app.services.gemini_analyzer import GeminiAnalyzer

        client = genai.Client(api_key=settings.gemini_api_key)
        return GeminiAnalyzer(client=client, model=settings.gemini_model)

    # OpenAI provider
    if not settings.openai_api_key:
        return MockAnalyzer()
    try:
        from openai import OpenAI
    except ImportError:
        return MockAnalyzer()
    from app.services.openai_analyzer import OpenAIAnalyzer

    client = OpenAI(api_key=settings.openai_api_key)
    return OpenAIAnalyzer(client=client, model=settings.openai_model)
