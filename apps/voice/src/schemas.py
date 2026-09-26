from pydantic import BaseModel, Field


class PersonaBody(BaseModel):
    """Structured persona input; the engine owns the template (spec D1)."""

    name: str = ""
    roleTitle: str = ""
    personality: str = ""
    style: str = ""
    objective: str = ""


class ScenarioBody(BaseModel):
    title: str = ""
    objective: str = ""
    cefrLevel: str = "B1"


class LearnerBody(BaseModel):
    level: str = "B1"
    goals: list[str] = Field(default_factory=list)


class RunnerBody(BaseModel):
    """Session payload Go sends in the /start body."""

    userId: str
    conversationId: str
    maxDuration: int = Field(default=300, ge=30, le=3600)
    persona: PersonaBody | None = None
    scenario: ScenarioBody | None = None
    learner: LearnerBody | None = None
