from typing import Any, Literal

from pydantic import BaseModel, Field

Priority = Literal["LOW", "MEDIUM", "HIGH", "URGENT"]
FieldType = Literal[
    "SHORT_TEXT",
    "LONG_TEXT",
    "EMAIL",
    "URL",
    "SELECT",
    "MULTI_SELECT",
    "RATING",
    "DATE",
]


class AnalyzeProfile(BaseModel):
    username: str
    displayName: str | None = None


class AnalyzeBoundary(BaseModel):
    title: str
    description: str
    priority: Priority = "MEDIUM"


class AnalyzeField(BaseModel):
    id: str
    label: str
    type: FieldType


class AnalyzeEndpoint(BaseModel):
    slug: str
    title: str
    description: str | None = None
    boundaries: list[AnalyzeBoundary] = Field(default_factory=list)
    fields: list[AnalyzeField] = Field(default_factory=list)


class AnalyzeSubmission(BaseModel):
    id: str
    submitterName: str | None = None
    submitterEmail: str | None = None
    message: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class AnalyzeSubmissionRequest(BaseModel):
    profile: AnalyzeProfile
    endpoint: AnalyzeEndpoint
    submission: AnalyzeSubmission
