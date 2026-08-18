from __future__ import annotations

import json
from types import SimpleNamespace

import pytest

from app.models.company import DEFAULT_COMPANY_PROFILE
from app.models.errors import AnalysisFailedError
from app.services.gemini_analyzer import GeminiAnalyzer
from app.services.mock_analyzer import load_mock_result
from app.services.pdf_parser import PageText


class _FakeClient:
    def __init__(self, response=None, raises=None):
        self._response = response
        self._raises = raises
        self.calls: list[dict] = []
        self.models = SimpleNamespace(generate_content=self._generate_content)

    def _generate_content(self, **kwargs):
        self.calls.append(kwargs)
        if self._raises is not None:
            raise self._raises
        return self._response


def _text_response(content: str) -> SimpleNamespace:
    return SimpleNamespace(text=content, candidates=None)


@pytest.fixture()
def sample_pages() -> list[PageText]:
    return [
        PageText(page=1, text="사업 개요 텍스트 " * 20),
        PageText(page=2, text="요구사항 텍스트 " * 20),
    ]


def test_gemini_analyzer_parses_success_response(sample_pages):
    payload = load_mock_result("korea_investment").model_dump()
    payload["mode"] = "LIVE"
    client = _FakeClient(response=_text_response(json.dumps(payload)))
    analyzer = GeminiAnalyzer(client=client, model="gemini-2.0-flash")

    result = analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)

    assert result.mode == "LIVE"
    assert result.bid_decision.decision in {"GO", "CONDITIONAL_GO", "NO_GO"}
    assert client.calls, "Gemini 클라이언트가 호출되어야 한다"
    kwargs = client.calls[0]
    assert kwargs["model"] == "gemini-2.0-flash"
    assert kwargs["config"]["response_mime_type"] == "application/json"


def test_gemini_analyzer_forces_live_mode(sample_pages):
    payload = load_mock_result("korea_investment").model_dump()
    payload["mode"] = "MOCK"
    client = _FakeClient(response=_text_response(json.dumps(payload)))
    analyzer = GeminiAnalyzer(client=client, model="gemini-2.0-flash")

    result = analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)

    assert result.mode == "LIVE"


def test_gemini_analyzer_wraps_client_exception(sample_pages):
    client = _FakeClient(raises=RuntimeError("gemini boom"))
    analyzer = GeminiAnalyzer(client=client, model="gemini-2.0-flash")

    with pytest.raises(AnalysisFailedError):
        analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)


def test_gemini_analyzer_rejects_invalid_json(sample_pages):
    client = _FakeClient(response=_text_response("not json"))
    analyzer = GeminiAnalyzer(client=client, model="gemini-2.0-flash")

    with pytest.raises(AnalysisFailedError):
        analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)


def test_gemini_analyzer_rejects_schema_mismatch(sample_pages):
    client = _FakeClient(response=_text_response('{"unexpected": true}'))
    analyzer = GeminiAnalyzer(client=client, model="gemini-2.0-flash")

    with pytest.raises(AnalysisFailedError):
        analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)


def test_gemini_analyzer_reads_candidates_fallback(sample_pages):
    payload = load_mock_result("korea_investment").model_dump()
    payload["mode"] = "LIVE"
    part = SimpleNamespace(text=json.dumps(payload))
    content = SimpleNamespace(parts=[part])
    response = SimpleNamespace(text=None, candidates=[SimpleNamespace(content=content)])
    client = _FakeClient(response=response)
    analyzer = GeminiAnalyzer(client=client, model="gemini-2.0-flash")

    result = analyzer.analyze(sample_pages, DEFAULT_COMPANY_PROFILE)

    assert result.mode == "LIVE"
