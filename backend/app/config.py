from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Literal

try:
    from dotenv import find_dotenv, load_dotenv
except ImportError:  # pragma: no cover
    find_dotenv = None  # type: ignore[assignment]
    load_dotenv = None  # type: ignore[assignment]
else:
    _dotenv_path = find_dotenv(usecwd=True)
    if _dotenv_path:
        # override=False: 이미 export 된 환경변수는 존중, 없으면 .env 값 채움
        load_dotenv(_dotenv_path, override=False)

Provider = Literal["gemini", "openai"]


def _get_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def _get_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _get_list(name: str, default: list[str]) -> list[str]:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return list(default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def _get_provider(default: Provider = "gemini") -> Provider:
    raw = (os.getenv("LLM_PROVIDER") or "").strip().lower()
    if raw in {"gemini", "google"}:
        return "gemini"
    if raw in {"openai", "gpt"}:
        return "openai"
    return default


@dataclass(frozen=True)
class Settings:
    llm_provider: Provider
    openai_api_key: str | None
    openai_model: str
    gemini_api_key: str | None
    gemini_model: str
    mock_mode: bool
    max_pdf_bytes: int
    cors_allow_origins: list[str]

    @property
    def mode(self) -> str:
        """What the user configured via MOCK_MODE.

        Not necessarily what will actually run — see `effective_mode`.
        """
        return "MOCK" if self.mock_mode else "LIVE"

    @property
    def has_live_credentials(self) -> bool:
        """Whether the configured provider actually has a usable key."""
        if self.llm_provider == "gemini":
            return bool(self.gemini_api_key)
        if self.llm_provider == "openai":
            return bool(self.openai_api_key)
        return False

    @property
    def effective_mode(self) -> str:
        """What analyzer_factory will actually serve.

        Returns "MOCK" whenever mock_mode is true OR the configured live
        provider has no key. This is the value the UI should display so
        the operator can tell a real live run from a silent fallback.
        """
        if self.mock_mode:
            return "MOCK"
        if not self.has_live_credentials:
            return "MOCK"
        return "LIVE"

    @property
    def active_model(self) -> str:
        return (
            self.openai_model
            if self.llm_provider == "openai"
            else self.gemini_model
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        llm_provider=_get_provider("gemini"),
        openai_api_key=os.getenv("OPENAI_API_KEY") or None,
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
        mock_mode=_get_bool("MOCK_MODE", True),
        max_pdf_bytes=_get_int("MAX_PDF_BYTES", 25 * 1024 * 1024),
        cors_allow_origins=_get_list("CORS_ALLOW_ORIGINS", ["http://localhost:5173"]),
    )


def reset_settings_cache() -> None:
    """Test helper: clear the settings cache and cached SDK clients."""
    get_settings.cache_clear()
    try:  # avoid circular import at module load
        from app.services import analyzer_factory

        analyzer_factory.reset_client_cache()
    except ImportError:  # pragma: no cover
        pass
