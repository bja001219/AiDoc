from __future__ import annotations

import io
import logging
from dataclasses import dataclass

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.models.errors import EmptyPDFTextError, InvalidPDFError

logger = logging.getLogger(__name__)

MIN_TOTAL_CHARS = 200


@dataclass(frozen=True)
class PageText:
    page: int
    text: str


def extract_pages(pdf_bytes: bytes) -> list[PageText]:
    """Parse PDF bytes into a list of (page_number, text)."""
    if not pdf_bytes:
        raise InvalidPDFError("PDF 파일이 비어 있습니다.")

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
    except (PdfReadError, OSError, ValueError) as exc:
        raise InvalidPDFError(f"PDF 파일을 열 수 없습니다: {exc}") from exc

    if not reader.pages:
        raise EmptyPDFTextError(
            "텍스트를 추출할 수 없는 PDF입니다. "
            "현재 MVP에서는 OCR을 지원하지 않습니다."
        )

    pages: list[PageText] = []
    for index, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as exc:  # noqa: BLE001 — pypdf raises assorted types
            # [M-5] never swallow silently — an operator needs to know which
            # page failed if extraction quality regresses.
            logger.warning(
                "pypdf failed to extract text from page %d: %s: %s",
                index,
                type(exc).__name__,
                exc,
            )
            text = ""
        pages.append(PageText(page=index, text=text.strip()))

    total_chars = sum(len(p.text) for p in pages)
    if total_chars < MIN_TOTAL_CHARS:
        raise EmptyPDFTextError(
            "텍스트를 추출할 수 없는 PDF입니다. "
            "현재 MVP에서는 OCR을 지원하지 않습니다."
        )

    return pages


def format_pages(pages: list[PageText]) -> str:
    chunks: list[str] = []
    for page in pages:
        chunks.append(f"=== PAGE {page.page} ===\n{page.text}")
    return "\n\n".join(chunks)
