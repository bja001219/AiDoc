from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.models.analysis import AnalysisResult
from app.models.company import DEFAULT_COMPANY_PROFILE, CompanyProfile
from app.models.errors import InvalidPDFError, InvalidRequestError, PDFTooLargeError
from app.services.analyzer_base import Analyzer
from app.services.analyzer_factory import build_analyzer
from app.services.pdf_parser import extract_pages

router = APIRouter(prefix="/api", tags=["analyze"])


def _validate_pdf(upload: UploadFile, max_bytes: int, size: int) -> None:
    filename = (upload.filename or "").lower()
    content_type = (upload.content_type or "").lower()

    if not filename.endswith(".pdf"):
        raise InvalidPDFError("PDF 파일만 업로드할 수 있습니다.")
    if content_type and content_type not in {"application/pdf", "application/x-pdf"}:
        raise InvalidPDFError("PDF 파일만 업로드할 수 있습니다.")
    if size <= 0:
        raise InvalidPDFError("업로드된 파일이 비어 있습니다.")
    if size > max_bytes:
        raise PDFTooLargeError(
            f"파일 크기가 허용 한도({max_bytes} bytes)를 초과했습니다."
        )


def _parse_company(raw: str | None) -> CompanyProfile:
    if raw is None or not raw.strip():
        return DEFAULT_COMPANY_PROFILE

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InvalidRequestError(
            "company 필드가 올바른 JSON 이 아닙니다."
        ) from exc

    try:
        return CompanyProfile.model_validate(payload)
    except ValidationError as exc:
        raise InvalidRequestError(
            f"company 프로필이 유효하지 않습니다: {exc}"
        ) from exc


def _get_analyzer(settings: Settings = Depends(get_settings)) -> Analyzer:
    return build_analyzer(settings)


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_rfp(
    file: UploadFile = File(...),
    company: str | None = Form(default=None),
    settings: Settings = Depends(get_settings),
    analyzer: Analyzer = Depends(_get_analyzer),
) -> AnalysisResult:
    pdf_bytes = await file.read()
    _validate_pdf(file, settings.max_pdf_bytes, len(pdf_bytes))

    profile = _parse_company(company)
    pages = extract_pages(pdf_bytes)
    result = analyzer.analyze(pages, profile)
    return result
