from typing import Literal

from pydantic import BaseModel

BoundaryStatus = Literal["FITS", "UNCLEAR", "VIOLATES", "NEEDS_REVIEW"]
Priority = Literal["LOW", "MEDIUM", "HIGH", "URGENT"]


class AnalyzeSubmissionResponse(BaseModel):
    summary: str
    intent: str
    boundaryStatus: BoundaryStatus
    priority: Priority
    suggestedReply: str
