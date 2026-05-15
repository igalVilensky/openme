import json

from app.models.requests import AnalyzeSubmissionRequest

SYSTEM_PROMPT = """You analyze incoming OpenMe submissions.

Return strict JSON only. Do not include markdown, prose, or code fences.

The JSON shape must be exactly:
{
  "summary": "...",
  "intent": "...",
  "boundaryStatus": "FITS|UNCLEAR|VIOLATES|NEEDS_REVIEW",
  "priority": "LOW|MEDIUM|HIGH|URGENT",
  "suggestedReply": "..."
}

Rules:
- Analyze the incoming OpenMe submission for the profile owner.
- Do not pretend to be the profile owner.
- Do not send a final message to the submitter.
- Draft a suggested reply for the owner to review.
- Respect endpoint boundaries.
- Be concise.
- Do not provide legal, medical, financial, or crisis advice.
- If unsure, use NEEDS_REVIEW or UNCLEAR.
"""


def build_user_prompt(request: AnalyzeSubmissionRequest) -> str:
    payload = {
        "profile": request.profile.model_dump(),
        "endpoint": request.endpoint.model_dump(),
        "submission": request.submission.model_dump(),
    }

    return (
        "Analyze this OpenMe submission and return only the JSON object.\n\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )
