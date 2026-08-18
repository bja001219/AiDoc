from __future__ import annotations

from pydantic import BaseModel, Field


class CompanyProfile(BaseModel):
    """User-supplied company profile used to score RFP fit."""

    name: str = Field(..., min_length=1)
    tech_stack: list[str] = Field(default_factory=list)
    people: list[str] = Field(default_factory=list)
    capabilities: list[str] = Field(default_factory=list)
    experiences: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    notes: str | None = None


DEFAULT_COMPANY_PROFILE = CompanyProfile(
    name="Demo AI Solutions",
    tech_stack=["Python", "FastAPI", "React", "LLM API", "RAG", "Linux"],
    people=["PM 1", "Backend 2", "Frontend 1", "AI Engineer 1"],
    capabilities=[
        "Web service development",
        "AI API integration",
        "Internal knowledge search system",
    ],
    experiences=[],
    certifications=[],
    notes="공공사업 수행실적 없음, 별도 인증 없음",
)
