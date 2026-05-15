import json
from typing import Any

from app.models.requests import AnalyzeSubmissionRequest
from app.models.responses import AnalyzeSubmissionResponse, BoundaryStatus, Priority


def _value_to_text(value: Any) -> str:
    if value is None:
        return ""

    if isinstance(value, str):
        return value

    if isinstance(value, (int, float, bool)):
        return str(value)

    if isinstance(value, list):
        return " ".join(_value_to_text(item) for item in value)

    if isinstance(value, dict):
        return " ".join(_value_to_text(item) for item in value.values())

    return json.dumps(value, ensure_ascii=False)


def _analysis_text(request: AnalyzeSubmissionRequest) -> str:
    parts = [request.submission.message or ""]
    parts.extend(_value_to_text(value) for value in request.submission.data.values())

    return " ".join(part for part in parts if part).strip()


def _intent_for_slug(slug: str) -> str:
    normalized_slug = slug.lower()

    if "collaborate" in normalized_slug:
        return "collaboration_request"

    if "feedback" in normalized_slug:
        return "feedback"

    if "ask" in normalized_slug:
        return "question"

    return "general_request"


def _priority_for_text(text: str) -> Priority:
    lowered = text.lower()

    if any(term in lowered for term in ("urgent", "asap", "immediately")):
        return "HIGH"

    return "MEDIUM"


def _boundary_status_for_text(text: str) -> BoundaryStatus:
    lowered = text.lower()

    if any(term in lowered for term in ("free", "unpaid", "do it for me")):
        return "VIOLATES"

    if any(term in lowered for term in ("urgent", "asap", "not sure")):
        return "UNCLEAR"

    return "FITS"


def _summary(request: AnalyzeSubmissionRequest, intent: str) -> str:
    submitter = request.submission.submitterName or "Someone"
    endpoint_title = request.endpoint.title or request.endpoint.slug
    readable_intent = intent.replace("_", " ")

    return f"{submitter} sent a {readable_intent} for {endpoint_title}."


def _suggested_reply(request: AnalyzeSubmissionRequest) -> str:
    name = request.submission.submitterName
    greeting = f"Hi {name}," if name else "Hi,"

    return (
        f"{greeting} thanks for reaching out. I will review this and get back "
        "to you if it is a good fit."
    )


def analyze_with_mock(
    request: AnalyzeSubmissionRequest,
) -> AnalyzeSubmissionResponse:
    text = _analysis_text(request)
    intent = _intent_for_slug(request.endpoint.slug)

    return AnalyzeSubmissionResponse(
        summary=_summary(request, intent),
        intent=intent,
        boundaryStatus=_boundary_status_for_text(text),
        priority=_priority_for_text(text),
        suggestedReply=_suggested_reply(request),
    )
