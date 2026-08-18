from __future__ import annotations

import json
from importlib import resources

from app.models.analysis import AnalysisResult
from app.models.company import CompanyProfile
from app.services.pdf_parser import PageText


class MockAnalyzer:
    """Return a pre-baked analysis result — no OpenAI call required.

    The pages/company inputs are accepted for interface compatibility but
    intentionally ignored: mock mode should always give a demo-quality result.
    """

    def __init__(self, dataset: str = "korea_investment") -> None:
        self._dataset = dataset

    def analyze(
        self, pages: list[PageText], company: CompanyProfile
    ) -> AnalysisResult:
        return load_mock_result(self._dataset)


def load_mock_result(dataset: str = "korea_investment") -> AnalysisResult:
    resource = resources.files("app.mocks").joinpath(f"{dataset}.json")
    payload = json.loads(resource.read_text(encoding="utf-8"))
    return AnalysisResult.model_validate(payload)
