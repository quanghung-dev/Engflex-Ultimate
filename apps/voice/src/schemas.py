from pydantic import BaseModel, Field


class RunnerBody(BaseModel):
    """Session payload Go sends in the /start body."""

    userId: str
    conversationId: str
    maxDuration: int = Field(default=300, ge=30, le=3600)
