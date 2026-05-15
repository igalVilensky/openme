import re


def strip_markdown_json_fence(value: str) -> str:
    text = value.strip()

    if not text.startswith("```"):
        return text

    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    return text.strip()
