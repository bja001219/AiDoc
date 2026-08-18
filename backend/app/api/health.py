from fastapi import APIRouter, Depends

from app.config import Settings, get_settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health(settings: Settings = Depends(get_settings)) -> dict:
    return {
        "status": "ok",
        "mode": settings.effective_mode,       # what will actually serve
        "configured_mode": settings.mode,       # what MOCK_MODE was set to
        "provider": settings.llm_provider,
        "model": settings.active_model,
    }
