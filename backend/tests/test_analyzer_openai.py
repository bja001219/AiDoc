from __future__ import annotations

import json
from types import SimpleNamespace

import pytest

from app.models.company import DEFAULT_COMPANY_PROFILE
from app.models.errors import AnalysisFailedError
from app.services.mock_analyzer import load_mock_result
from app.services.openai_analyzer import OpenAIAnalyzer
from app.services.pdf_parser import PageText


def _mock_completion(content: str) -> SimpleNamespace:
    """Build a minimal object that mimics openai's ChatCompletion response."""
    message = SimpleNamespace(content=content)
    choice = SimpleNamespace(message=message)
    return SimpleNamespace(choices=[choice])


class _FakeClient:
    def __init__(self, response=None, raises=None):
        self._response = response
        self._raises = raises
        self.calls: list[dict] = []
        self.chat = SimpleNamespace(
            completions=SimpleNamespace(create=self._create)
        )

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        if self._raises is not None:
            raise self._raises
        return self._response


@pytest.fixture()
def sample_pages() -> list[PageText]:
    return [
        PageText(page=1, text="사업 개요 텍스트 " * 20),
        PageText(page=2, text="요구사항 텍스트 " * 20),
    ]


def test_openai_analyzer_parses_success_response(sample_pages):
    payload = load_mock_result("korea_investment").model_dump()
    payload["mode"] = "LIVE"
    client = _FakeClient(response=_mock_completion(json.dumps(payload)))
    analyzer = OpenAIAnalyzer(client=client, model="gpt-4o-mini")

    result = analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)

    assert result.mode == "LIVE"
    assert result.bid_decision.decision in {"GO", "CONDITIONAL_GO", "NO_GO"}
    assert client.calls, "OpenAI 클라이언트가 호출되어야 한다"
    kwargs = client.calls[0]
    assert kwargs["model"] == "gpt-4o-mini"
    assert kwargs["response_format"] == {"type": "json_object"}


def test_openai_analyzer_forces_live_mode(sample_pages):
    payload = load_mock_result("korea_investment").model_dump()
    payload["mode"] = "MOCK"  # 서버가 잘못 반환하더라도 LIVE 로 덮어써야 한다
    client = _FakeClient(response=_mock_completion(json.dumps(payload)))
    analyzer = OpenAIAnalyzer(client=client, model="gpt-4o-mini")

    result = analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)

    assert result.mode == "LIVE"


def test_openai_analyzer_wraps_client_exception(sample_pages):
    client = _FakeClient(raises=RuntimeError("boom"))
    analyzer = OpenAIAnalyzer(client=client, model="gpt-4o-mini")

    with pytest.raises(AnalysisFailedError):
        analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)


def test_openai_analyzer_rejects_invalid_json(sample_pages):
    client = _FakeClient(response=_mock_completion("not json"))
    analyzer = OpenAIAnalyzer(client=client, model="gpt-4o-mini")

    with pytest.raises(AnalysisFailedError):
        analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)


def test_openai_analyzer_rejects_schema_mismatch(sample_pages):
    client = _FakeClient(response=_mock_completion('{"unexpected": true}'))
    analyzer = OpenAIAnalyzer(client=client, model="gpt-4o-mini")

    with pytest.raises(AnalysisFailedError):
        analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)
