import logging

from app.config import settings
from app.models.requests import AnalyzeSubmissionRequest
from app.models.responses import AnalyzeSubmissionResponse
from app.services.groq_client import analyze_with_groq
from app.services.mock_analyzer import analyze_with_mock

logger = logging.getLogger(__name__)


async def analyze_submission(
    request: AnalyzeSubmissionRequest,
) -> AnalyzeSubmissionResponse:
    if settings.provider == "groq" and settings.groq_configured:
        try:
            return await analyze_with_groq(request, settings)
        except Exception:
            logger.exception("Groq analysis failed; falling back to mock analysis")

    return analyze_with_mock(request)
