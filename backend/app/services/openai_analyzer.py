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


class OpenAIAnalyzer:
    """Analyzer that calls the OpenAI Chat Completions API with JSON output."""

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
            response = self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
        except Exception as exc:  # network / rate limit / auth
            raise AnalysisFailedError(f"OpenAI 호출 실패: {exc}") from exc

        content = _extract_content(response)
        if not content:
            raise AnalysisFailedError("OpenAI 응답에 콘텐츠가 없습니다.")

        try:
            payload = json.loads(content)
        except json.JSONDecodeError as exc:
            raise AnalysisFailedError(
                f"OpenAI 응답을 JSON으로 파싱할 수 없습니다: {exc}"
            ) from exc

        payload["mode"] = "LIVE"

        try:
            return AnalysisResult.model_validate(payload)
        except ValidationError as exc:
            raise AnalysisFailedError(
                f"OpenAI 응답이 스키마와 일치하지 않습니다: {exc}"
            ) from exc


def _extract_content(response: Any) -> str | None:
    try:
        return response.choices[0].message.content
    except (AttributeError, IndexError, KeyError):
        return None
