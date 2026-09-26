"""On-demand per-turn feedback.

Go calls this route synchronously when the learner taps Analyze on one turn
(spec D9/D10). It talks to the LLM through the `openai` SDK directly rather
than the pipecat LLM service: the analysis is a one-shot offline
classification, so the streaming service's frames, context management,
interruption handling, and metrics are all irrelevant overhead.

Two paths, both validating:

1. `chat.completions.parse()` with the `TurnFeedback` model. The SDK derives
   the strict JSON schema from the model (so it can never drift from it) and
   returns a typed object, with refusals detectable via `message.refusal`.
2. Fallback: the prompt demands a bare JSON object, the reply is scanned for
   its first balanced `{...}` block, and `model_validate_json` validates it.

Path 2 exists because structured output is NOT available on this route
(D19). Probed 2026-09-25 against space-bunny-free via the zen proxy:
`response_format` in both strict `json_schema` and `json_object` form is
accepted by the proxy but ignored by the upstream model, which answers in
markdown. Path 1 is still attempted first so the code is correct-by-
construction for a route that does honour it, and switching costs a config
flag rather than a rewrite.

Note: OpenAI's preferred surface is `responses.parse(text_format=...)`, but
the Responses endpoint is not served here. Do not migrate.

The prompt asks for exactly four keys. It deliberately does NOT ask for
phonemes or a speech block: those are acoustic measurements with no source in
P2 (D11/D12), and a model asked for them will confidently invent numbers.
"""

from typing import Literal

from loguru import logger
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from config import settings


class WordMark(BaseModel):
    word: str
    status: Literal["accurate", "warning", "error"]


class PhraseUpgrade(BaseModel):
    original: str
    replacements: list[str]
    category: str


class TurnFeedback(BaseModel):
    """The four language keys. No speech block: nothing can populate it yet.

    All four are required, with no defaults: the SDK derives a strict JSON
    schema from this model and lists every property in `required`, so a
    default here would make the model and its own schema disagree about
    whether `marks` may be absent. Nothing constructs this type directly, so
    there is nothing for a default to serve.
    """

    annotated: str
    marks: list[WordMark]
    upgrades: list[PhraseUpgrade]
    tip: str


class ContextTurn(BaseModel):
    role: str
    text: str


class AnalyzeRequest(BaseModel):
    """One turn to analyze plus the prior turns needed to judge it.

    Deliberately carries no CEFR level and no scenario objective: the
    conversation context already expresses what the session is about, and the
    ask "is this correct English" does not vary by level.
    """

    conversationId: str
    turnId: str
    text: str
    context: list[ContextTurn] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    feedback: dict


class AnalysisRefused(Exception):
    """The model declined. Distinct from a malformed reply so logs say which."""


class _StructuredUnsupported(Exception):
    """Internal signal: the route accepted response_format but ignored it."""


def build_feedback_prompt(req: AnalyzeRequest) -> str:
    context_lines = "\n".join(f"  {t.role}: {t.text}" for t in req.context) or "  (none)"
    return (
        "You are an English coach reviewing ONE learner utterance in a live "
        "spoken conversation. Judge only this utterance.\n\n"
        "Conversation so far (most recent last):\n"
        f"{context_lines}\n\n"
        f"Utterance to review: {req.text}\n\n"
        "Reply with a single JSON object and nothing else. No prose, no "
        "explanation, no code fences, no markdown. The object must have "
        "exactly these four keys:\n"
        '  "annotated": the utterance with the learner\'s own words kept, lightly '
        "corrected where it reads or sounds wrong;\n"
        '  "marks": [{"word": "<word as spoken>", "status": '
        '"accurate|warning|error"}];\n'
        '  "upgrades": [{"original": "<phrase>", "replacements": ["<better>"], '
        '"category": "<grammar|vocabulary|phrasing|naturalness>"}];\n'
        '  "tip": one short sentence of coaching.\n'
        "Never mention model names."
    )


def extract_json_object(raw: str) -> str:
    """Return the first balanced {...} block in a reply, else raise.

    Balanced-brace scanning (not a greedy regex) so a `}` inside a string
    value cannot truncate the object, and a later stray block cannot win over
    the first one.
    """
    start = raw.find("{")
    while start != -1:
        depth = 0
        in_string = False
        escaped = False
        for idx in range(start, len(raw)):
            char = raw[idx]
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
                continue
            if char == '"':
                in_string = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return raw[start : idx + 1]
        start = raw.find("{", start + 1)
    raise ValueError("analysis reply contained no JSON object")


def parse_feedback(raw: str) -> TurnFeedback:
    """Extract and validate the feedback object from an LLM reply."""
    return TurnFeedback.model_validate_json(extract_json_object(raw))


def _client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        timeout=settings.analyze_timeout_sec,
        default_headers={
            "User-Agent": settings.opencode_user_agent,
            "x-opencode-session": settings.analyze_session_prefix,
        },
    )


def _messages(req: AnalyzeRequest) -> list[dict]:
    # The system prompt carries the full review brief, but the request must
    # never be system-only: the upstream provider rejects user-less requests
    # with a 400 (the same constraint that forces the "Hello!" opener on the
    # session path). The user message repeats the utterance as the target.
    return [
        {"role": "system", "content": build_feedback_prompt(req)},
        {"role": "user", "content": f"Utterance to review: {req.text}"},
    ]


async def _structured(client: AsyncOpenAI, req: AnalyzeRequest) -> TurnFeedback:
    """Primary path: hand the pydantic model to the SDK.

    The SDK derives the strict JSON schema from the model, sends it as
    response_format, and parses the reply back into TurnFeedback. A refusal
    is a distinct, programmatically detectable outcome (`parsed` is None and
    `refusal` carries the reason), so it must be checked before treating a
    missing result as a fallback trigger.
    """
    completion = await client.chat.completions.parse(
        model=settings.llm_name,
        messages=_messages(req),
        response_format=TurnFeedback,
        temperature=0.2,
    )
    message = completion.choices[0].message
    if message.refusal:
        raise AnalysisRefused(message.refusal)
    if message.parsed is not None:
        return message.parsed
    raise _StructuredUnsupported


async def _extraction(client: AsyncOpenAI, req: AnalyzeRequest) -> TurnFeedback:
    """Fallback: prompt-forced JSON, then extract and validate."""
    completion = await client.chat.completions.create(
        model=settings.llm_name,
        messages=_messages(req),
        temperature=0.2,
    )
    return parse_feedback(completion.choices[0].message.content or "")


async def analyze_turn(req: AnalyzeRequest) -> TurnFeedback:
    """Run one analysis pass.

    Raises AnalysisRefused, or ValueError/ValidationError from the fallback
    parser, on any unusable reply. The caller turns those into a 5xx so Go
    reports a per-turn error instead of storing a partial payload.
    """
    client = _client()
    if not settings.analysis_structured_output:
        return await _extraction(client, req)
    try:
        return await _structured(client, req)
    except _StructuredUnsupported:
        logger.info(
            "structured output unsupported on this route; using extraction",
            model=settings.llm_name,
        )
    except AnalysisRefused:
        raise
    except Exception as exc:  # noqa: BLE001 - route may not support the param at all
        logger.warning(
            "structured output call failed; using extraction",
            model=settings.llm_name,
            error=str(exc)[:200],
        )
    return await _extraction(client, req)
