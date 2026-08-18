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

_READ_CHUNK = 1 << 20  # 1 MiB


def _validate_meta(upload: UploadFile, max_bytes: int) -> None:
    """Cheap checks that don't require reading the body.

    Rejects non-PDF filenames / MIME early, and short-circuits an
    obviously oversized Content-Length before we allocate any buffers.
    """
    filename = (upload.filename or "").lower()
    content_type = (upload.content_type or "").lower()

    if not filename.endswith(".pdf"):
        raise InvalidPDFError("PDF 파일만 업로드할 수 있습니다.")
    if content_type and content_type not in {"application/pdf", "application/x-pdf"}:
        raise InvalidPDFError("PDF 파일만 업로드할 수 있습니다.")

    # Starlette's UploadFile.size may be None if the client didn't send
    # Content-Length. When present, reject upfront so we never buffer the
    # oversized body at all.
    declared = getattr(upload, "size", None)
    if isinstance(declared, int) and declared > max_bytes:
        raise PDFTooLargeError(
            f"파일 크기가 허용 한도({max_bytes} bytes)를 초과했습니다.",
        )


async def _read_bounded(upload: UploadFile, max_bytes: int) -> bytes:
    """Read the upload body up to max_bytes; raise PDFTooLargeError past that.

    Streams in 1 MiB chunks so a malicious 500 MB upload never gets fully
    buffered in RAM before the size check fires.
    """
    total = 0
    chunks: list[bytes] = []
    while True:
        chunk = await upload.read(_READ_CHUNK)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise PDFTooLargeError(
                f"파일 크기가 허용 한도({max_bytes} bytes)를 초과했습니다.",
            )
        chunks.append(chunk)
    return b"".join(chunks)


def _parse_company(raw: str | None) -> CompanyProfile:
    if raw is None or not raw.strip():
        return DEFAULT_COMPANY_PROFILE

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InvalidRequestError(
            "company 필드가 올바른 JSON 이 아닙니다.",
        ) from exc

    try:
        return CompanyProfile.model_validate(payload)
    except ValidationError as exc:
        raise InvalidRequestError(
            f"company 프로필이 유효하지 않습니다: {exc}",
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
    _validate_meta(file, settings.max_pdf_bytes)
    pdf_bytes = await _read_bounded(file, settings.max_pdf_bytes)
    if not pdf_bytes:
        raise InvalidPDFError("업로드된 파일이 비어 있습니다.")

    profile = _parse_company(company)
    pages = extract_pages(pdf_bytes)
    return analyzer.analyze(pages, profile)
