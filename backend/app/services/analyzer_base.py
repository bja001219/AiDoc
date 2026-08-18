from __future__ import annotations

from typing import Protocol

from app.models.analysis import AnalysisResult
from app.models.company import CompanyProfile
from app.services.pdf_parser import PageText


class Analyzer(Protocol):
    """Interface that RFP analyzers implement."""

    def analyze(
        self, pages: list[PageText], company: CompanyProfile
    ) -> AnalysisResult: ...
