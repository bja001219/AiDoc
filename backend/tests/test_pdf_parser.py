from __future__ import annotations

from fpdf import FPDF
import pytest

from app.models.errors import EmptyPDFTextError, InvalidPDFError
from app.services.pdf_parser import extract_pages, format_pages


def _make_pdf(page_texts: list[str]) -> bytes:
    pdf = FPDF()
    pdf.set_font("Helvetica", size=12)
    for text in page_texts:
        pdf.add_page()
        pdf.multi_cell(0, 8, text)
    return bytes(pdf.output())


def test_extract_pages_returns_text_per_page():
    pdf_bytes = _make_pdf(
        [
            "First page contents. " * 20,
            "Second page contents. " * 20,
        ]
    )

    pages = extract_pages(pdf_bytes)

    assert len(pages) == 2
    assert pages[0].page == 1
    assert pages[1].page == 2
    assert "First page contents." in pages[0].text
    assert "Second page contents." in pages[1].text


def test_extract_pages_rejects_non_pdf_bytes():
    with pytest.raises(InvalidPDFError):
        extract_pages(b"not a pdf")


def test_extract_pages_rejects_empty_bytes():
    with pytest.raises(InvalidPDFError):
        extract_pages(b"")


def test_extract_pages_raises_when_text_too_short():
    tiny = _make_pdf(["hi"])

    with pytest.raises(EmptyPDFTextError):
        extract_pages(tiny)


def test_format_pages_preserves_markers():
    pdf_bytes = _make_pdf(
        [
            "Alpha content. " * 20,
            "Beta content. " * 20,
        ]
    )
    pages = extract_pages(pdf_bytes)
    formatted = format_pages(pages)

    assert "=== PAGE 1 ===" in formatted
    assert "=== PAGE 2 ===" in formatted
    assert formatted.index("=== PAGE 1 ===") < formatted.index("=== PAGE 2 ===")
