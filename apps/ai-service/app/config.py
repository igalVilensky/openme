import os
from dataclasses import dataclass


def _clean(value: str | None, default: str) -> str:
    if value is None:
        return default

    cleaned = value.strip()

    return cleaned if cleaned else default


@dataclass(frozen=True)
class Settings:
    ai_provider: str = _clean(os.getenv("AI_PROVIDER"), "mock").lower()
    ai_service_token: str = _clean(os.getenv("AI_SERVICE_TOKEN"), "")
    groq_api_key: str = _clean(os.getenv("GROQ_API_KEY"), "")
    groq_model: str = _clean(
        os.getenv("GROQ_MODEL"), "llama-3.3-70b-versatile"
    )
    groq_api_url: str = _clean(
        os.getenv("GROQ_API_URL"),
        "https://api.groq.com/openai/v1/chat/completions",
    )

    @property
    def provider(self) -> str:
        return self.ai_provider if self.ai_provider in {"mock", "groq"} else "mock"

    @property
    def groq_configured(self) -> bool:
        return bool(self.groq_api_key)


settings = Settings()
