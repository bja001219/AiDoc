from __future__ import annotations

from app.models.analysis import (
    AnalysisResult,
    BidDecision,
    CompanyFit,
    Evidence,
    ProjectOverview,
    Requirement,
)
from app.models.company import DEFAULT_COMPANY_PROFILE, CompanyProfile


def _minimal_result() -> AnalysisResult:
    return AnalysisResult(
        mode="MOCK",
        project_overview=ProjectOverview(project_name="Test"),
        requirements=[
            Requirement(
                id="SFR-001",
                category="기능",
                title="테스트",
                description="설명",
                importance="High",
                evidence=Evidence(page=1, quote="근거"),
            )
        ],
        company_fit=CompanyFit(strengths=["a"], gaps=["b"], unknowns=["c"]),
        bid_decision=BidDecision(
            decision="GO",
            score=88,
            strengths=["s"],
            risks=["r"],
            rationale="reason",
        ),
    )


def test_analysis_result_roundtrip():
    original = _minimal_result()
    dumped = original.model_dump_json()
    restored = AnalysisResult.model_validate_json(dumped)
    assert restored == original


def test_bid_decision_score_bounds():
    from pydantic import ValidationError
    import pytest

    with pytest.raises(ValidationError):
        BidDecision(decision="GO", score=150, strengths=[], risks=[], rationale="x")


def test_company_profile_default_shape():
    profile = DEFAULT_COMPANY_PROFILE
    assert isinstance(profile, CompanyProfile)
    assert profile.name == "Demo AI Solutions"
    assert "Python" in profile.tech_stack
