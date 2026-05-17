import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.config import settings
from app.models.requests import AnalyzeSubmissionRequest
from app.models.responses import AnalyzeSubmissionResponse
from app.services.analyzer import analyze_submission

router = APIRouter()


def require_ai_service_token(
    x_openme_ai_token: str | None = Header(default=None),
) -> None:
    if not settings.ai_service_token:
        return

    if not x_openme_ai_token or not secrets.compare_digest(
        x_openme_ai_token, settings.ai_service_token
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="AI service token required",
        )


@router.post("/analyze-submission", response_model=AnalyzeSubmissionResponse)
async def analyze_submission_route(
    request: AnalyzeSubmissionRequest,
    _: None = Depends(require_ai_service_token),
) -> AnalyzeSubmissionResponse:
    return await analyze_submission(request)
