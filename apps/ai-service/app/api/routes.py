from fastapi import APIRouter

from app.models.requests import AnalyzeSubmissionRequest
from app.models.responses import AnalyzeSubmissionResponse
from app.services.analyzer import analyze_submission

router = APIRouter()


@router.post("/analyze-submission", response_model=AnalyzeSubmissionResponse)
async def analyze_submission_route(
    request: AnalyzeSubmissionRequest,
) -> AnalyzeSubmissionResponse:
    return await analyze_submission(request)
