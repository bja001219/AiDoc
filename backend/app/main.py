from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analyze, health
from app.api.errors import register_error_handlers
from app.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="PublicBid AI Assistant",
        description="AI-powered RFP Analysis for Public Sector Projects",
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    app.include_router(health.router)
    app.include_router(analyze.router)
    return app


app = create_app()
