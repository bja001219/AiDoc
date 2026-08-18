from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, conint


class Evidence(BaseModel):
    page: int | None = Field(default=None, ge=1)
    quote: str | None = None


class ProjectOverview(BaseModel):
    project_name: str | None = None
    agency: str | None = None
    purpose: str | None = None
    period: str | None = None
    budget: str | None = None
    bidding_method: str | None = None
    contract_method: str | None = None
    evidence: Evidence | None = None


Importance = Literal["High", "Medium", "Low"]


class Requirement(BaseModel):
    id: str
    category: str
    title: str
    description: str
    importance: Importance = "Medium"
    evidence: Evidence | None = None


class EligibilityItem(BaseModel):
    title: str
    detail: str | None = None
    evidence: Evidence | None = None


class EvaluationCriterion(BaseModel):
    name: str
    weight: str | None = None
    detail: str | None = None
    evidence: Evidence | None = None


class RequiredDocument(BaseModel):
    name: str
    note: str | None = None
    evidence: Evidence | None = None


RiskCategory = Literal["technical", "security", "schedule", "business"]


class Risk(BaseModel):
    category: RiskCategory
    title: str
    description: str
    evidence: Evidence | None = None


class CompanyFit(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    unknowns: list[str] = Field(default_factory=list)


BidDecisionValue = Literal["GO", "CONDITIONAL_GO", "NO_GO"]


class BidDecision(BaseModel):
    decision: BidDecisionValue
    score: conint(ge=0, le=100)  # type: ignore[valid-type]
    strengths: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    rationale: str


class ProposalStrategy(BaseModel):
    title: str
    description: str


class ProposalOutlineItem(BaseModel):
    section: str
    points: list[str] = Field(default_factory=list)


Mode = Literal["MOCK", "LIVE"]


class AnalysisResult(BaseModel):
    mode: Mode
    project_overview: ProjectOverview
    requirements: list[Requirement] = Field(default_factory=list)
    eligibility: list[EligibilityItem] = Field(default_factory=list)
    evaluation: list[EvaluationCriterion] = Field(default_factory=list)
    required_documents: list[RequiredDocument] = Field(default_factory=list)
    risks: list[Risk] = Field(default_factory=list)
    company_fit: CompanyFit = Field(default_factory=CompanyFit)
    bid_decision: BidDecision
    proposal_strategy: list[ProposalStrategy] = Field(default_factory=list)
    proposal_outline: list[ProposalOutlineItem] = Field(default_factory=list)
