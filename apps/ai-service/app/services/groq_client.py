import json

import httpx

from app.config import Settings
from app.models.requests import AnalyzeSubmissionRequest
from app.models.responses import AnalyzeSubmissionResponse
from app.services.prompt_builder import SYSTEM_PROMPT, build_user_prompt
from app.utils.text import strip_markdown_json_fence


class GroqAnalysisError(Exception):
    pass


def _validate_response_payload(payload: object) -> AnalyzeSubmissionResponse:
    if not isinstance(payload, dict):
        raise GroqAnalysisError("Groq response JSON was not an object")

    required_fields = [
        "summary",
        "intent",
        "boundaryStatus",
        "priority",
        "suggestedReply",
    ]

    for field in required_fields:
        if not isinstance(payload.get(field), str):
            raise GroqAnalysisError(f"Groq response field is invalid: {field}")

    try:
        return AnalyzeSubmissionResponse(**payload)
    except Exception as error:
        raise GroqAnalysisError("Groq response failed validation") from error


def _extract_message_content(payload: object) -> str:
    if not isinstance(payload, dict):
        raise GroqAnalysisError("Groq API response was not an object")

    choices = payload.get("choices")

    if not isinstance(choices, list) or not choices:
        raise GroqAnalysisError("Groq API response did not include choices")

    first_choice = choices[0]

    if not isinstance(first_choice, dict):
        raise GroqAnalysisError("Groq API choice was invalid")

    message = first_choice.get("message")

    if not isinstance(message, dict):
        raise GroqAnalysisError("Groq API message was invalid")

    content = message.get("content")

    if not isinstance(content, str):
        raise GroqAnalysisError("Groq API content was invalid")

    return content


async def analyze_with_groq(
    request: AnalyzeSubmissionRequest,
    settings: Settings,
) -> AnalyzeSubmissionResponse:
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.groq_api_key}",
    }
    payload = {
        "model": settings.groq_model,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": build_user_prompt(request),
            },
        ],
        "temperature": 0.2,
        "max_tokens": 700,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(settings.groq_api_url, headers=headers, json=payload)

    if response.status_code >= 400:
        raise GroqAnalysisError("Groq API returned an error")

    try:
        content = _extract_message_content(response.json())
        parsed_content = json.loads(strip_markdown_json_fence(content))
    except (json.JSONDecodeError, ValueError) as error:
        raise GroqAnalysisError("Groq API returned invalid JSON") from error

    return _validate_response_payload(parsed_content)
