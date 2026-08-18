"""Domain-specific exceptions surfaced through the API layer."""
from __future__ import annotations


class DomainError(Exception):
    """Base class for errors that should map to standard JSON responses."""

    code: str = "DOMAIN_ERROR"
    http_status: int = 400

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidPDFError(DomainError):
    code = "INVALID_PDF"
    http_status = 400


class InvalidRequestError(DomainError):
    code = "INVALID_REQUEST"
    http_status = 400


class PDFTooLargeError(DomainError):
    code = "PDF_TOO_LARGE"
    http_status = 413


class EmptyPDFTextError(DomainError):
    code = "EMPTY_PDF_TEXT"
    http_status = 422


class AnalysisFailedError(DomainError):
    code = "ANALYSIS_FAILED"
    http_status = 502
