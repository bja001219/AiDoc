from __future__ import annotations

import json
from typing import Any

from pydantic import ValidationError

from app.models.analysis import AnalysisResult
from app.models.company import CompanyProfile
from app.models.errors import AnalysisFailedError
from app.services.pdf_parser import PageText, format_pages
from app.services.prompts import SYSTEM_PROMPT, build_user_prompt

MAX_PROMPT_CHARS = 60_000


def _is_timeout_error(exc: BaseException) -> bool:
    name = type(exc).__name__.lower()
    return "timeout" in name or "timeout" in str(exc).lower()


class GeminiAnalyzer:
    """Analyzer that calls Google's Gemini API via google-genai."""

    def __init__(self, client: Any, model: str) -> None:
        self._client = client
        self._model = model

    def analyze(
        self, pages: list[PageText], company: CompanyProfile
    ) -> AnalysisResult:
        pages_text = format_pages(pages)
        if len(pages_text) > MAX_PROMPT_CHARS:
            pages_text = pages_text[:MAX_PROMPT_CHARS]

        user_prompt = build_user_prompt(pages_text, company)

        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=user_prompt,
                config={
                    "system_instruction": SYSTEM_PROMPT,
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                },
            )
        except Exception as exc:  # network / rate limit / auth / timeout
            if _is_timeout_error(exc):
                raise AnalysisFailedError(
                    "Gemini 응답이 시간 안에 도착하지 않았습니다. "
                    "잠시 후 다시 시도해 주세요.",
                ) from exc
            raise AnalysisFailedError(f"Gemini 호출 실패: {exc}") from exc

        content = _extract_text(response)
        if not content:
            raise AnalysisFailedError("Gemini 응답에 콘텐츠가 없습니다.")

        try:
            payload = json.loads(content)
        except json.JSONDecodeError as exc:
            raise AnalysisFailedError(
                f"Gemini 응답을 JSON으로 파싱할 수 없습니다: {exc}"
            ) from exc

        payload["mode"] = "LIVE"

        try:
            return AnalysisResult.model_validate(payload)
        except ValidationError as exc:
            raise AnalysisFailedError(
                f"Gemini 응답이 스키마와 일치하지 않습니다: {exc}"
            ) from exc


def _extract_text(response: Any) -> str | None:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text
    # google-genai 일부 버전은 candidates[0].content.parts[0].text 로 노출
    try:
        candidates = getattr(response, "candidates", None)
        if candidates:
            parts = candidates[0].content.parts
            joined = "".join(getattr(p, "text", "") or "" for p in parts)
            return joined or None
    except (AttributeError, IndexError, KeyError):
        return None
    return None
