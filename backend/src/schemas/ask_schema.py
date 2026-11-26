"""Request and response shapes for the /ask endpoint."""
from typing import Literal

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)


class AskResponse(BaseModel):
    question: str
    answer: str
    guardrail_action: Literal["NONE", "INTERVENED"]
    sources: list[str]
