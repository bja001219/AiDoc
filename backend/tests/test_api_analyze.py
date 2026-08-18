from __future__ import annotations

import json

import pytest
from fpdf import FPDF
from fastapi.testclient import TestClient

from app.config import reset_settings_cache
from app.main import create_app


def _make_pdf(page_texts: list[str]) -> bytes:
    pdf = FPDF()
    pdf.set_font("Helvetica", size=12)
    for text in page_texts:
        pdf.add_page()
        pdf.multi_cell(0, 8, text)
    return bytes(pdf.output())


@pytest.fixture(autouse=True)
def _reset_settings(monkeypatch):
    reset_settings_cache()
    monkeypatch.setenv("MOCK_MODE", "true")
    reset_settings_cache()
    yield
    monkeypatch.delenv("MOCK_MODE", raising=False)
    monkeypatch.delenv("MAX_PDF_BYTES", raising=False)
    reset_settings_cache()


@pytest.fixture()
def client() -> TestClient:
    return TestClient(create_app())


def test_analyze_mock_returns_full_result(client):
    pdf_bytes = _make_pdf(
        [
            "Korea Investment RFP contents. " * 20,
            "Requirements: SFR-001, SFR-002. " * 20,
        ]
    )
    files = {"file": ("test.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/api/analyze", files=files)

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["mode"] == "MOCK"
    assert "project_overview" in payload
    assert isinstance(payload["requirements"], list) and payload["requirements"]
    assert payload["bid_decision"]["decision"] in {"GO", "CONDITIONAL_GO", "NO_GO"}


def test_analyze_rejects_non_pdf_file(client):
    files = {"file": ("test.txt", b"plain text content", "text/plain")}
    response = client.post("/api/analyze", files=files)

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_PDF"


def test_analyze_rejects_empty_text_pdf(client):
    pdf_bytes = _make_pdf(["hi"])
    files = {"file": ("tiny.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/api/analyze", files=files)

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "EMPTY_PDF_TEXT"


def test_analyze_accepts_company_profile(client):
    pdf_bytes = _make_pdf(["Required content payload. " * 40])
    files = {"file": ("t.pdf", pdf_bytes, "application/pdf")}
    company_json = json.dumps(
        {
            "name": "Custom Co",
            "tech_stack": ["Python", "React"],
            "people": ["PM 1"],
            "capabilities": ["cap"],
            "experiences": [],
            "certifications": [],
        }
    )
    response = client.post(
        "/api/analyze", files=files, data={"company": company_json}
    )
    assert response.status_code == 200


def test_analyze_rejects_bad_company_json(client):
    pdf_bytes = _make_pdf(["Required content payload. " * 40])
    files = {"file": ("t.pdf", pdf_bytes, "application/pdf")}
    response = client.post(
        "/api/analyze", files=files, data={"company": "{ not json"}
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_REQUEST"


def test_analyze_rejects_oversized_upload(monkeypatch):
    """[H-3] Body must be rejected while streaming, not after full buffer."""
    monkeypatch.setenv("MOCK_MODE", "true")
    monkeypatch.setenv("MAX_PDF_BYTES", "2048")  # 2 KiB
    reset_settings_cache()

    fresh_client = TestClient(create_app())
    # Craft a PDF that is comfortably larger than 2 KiB.
    pdf_bytes = _make_pdf(["padding chunk " * 200 for _ in range(6)])
    assert len(pdf_bytes) > 2048, "fixture PDF must exceed the test limit"
    files = {"file": ("big.pdf", pdf_bytes, "application/pdf")}

    response = fresh_client.post("/api/analyze", files=files)

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "PDF_TOO_LARGE"
