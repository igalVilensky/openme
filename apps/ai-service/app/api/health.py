from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "service": "openme-ai-service",
        "provider": settings.provider,
        "groqConfigured": settings.groq_configured,
    }
