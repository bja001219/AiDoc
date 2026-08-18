from __future__ import annotations

from app.models.analysis import AnalysisResult
from app.models.company import DEFAULT_COMPANY_PROFILE
from app.services.mock_analyzer import MockAnalyzer, load_mock_result
from app.services.pdf_parser import PageText


def test_load_mock_result_matches_schema():
    result = load_mock_result("korea_investment")
    assert isinstance(result, AnalysisResult)
    assert result.mode == "MOCK"
    assert result.project_overview.project_name is not None
    assert len(result.requirements) >= 3
    assert result.bid_decision.decision in {"GO", "CONDITIONAL_GO", "NO_GO"}
    assert 0 <= result.bid_decision.score <= 100


def test_mock_analyzer_ignores_input():
    analyzer = MockAnalyzer()
    result_a = analyzer.analyze([], DEFAULT_COMPANY_PROFILE)
    result_b = analyzer.analyze(
        [PageText(page=1, text="whatever")], DEFAULT_COMPANY_PROFILE
    )
    assert result_a == result_b
    assert result_a.mode == "MOCK"
