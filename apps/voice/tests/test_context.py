"""Upstream payload-shape guards.

Probed 2026-09-25 against space-bunny-free via the zen proxy: a request with
no user message gets 400 invalid_request_error, and stuffing the prompt into
LLMContext as a system message is deprecated since pipecat 1.9. So the session
must open with the prompt on the service's system_instruction (one system
message on the wire) plus exactly one seeded user message.
"""

from pipeline.services import build_context, build_llm


def test_context_opens_with_single_user_message():
    ctx = build_context()
    # `messages` is typed as the union of provider-specific message shapes;
    # the seed we assert on is the plain dict form.
    roles = [_role(m) for m in ctx.messages]
    assert roles == ["user"]


def _role(message) -> str:
    return str(message.get("role")) if isinstance(message, dict) else message.role


def test_seeded_opener_is_a_bare_greeting():
    # Anything more specific makes the model reply to the opener
    # ("No problem-...") instead of delivering its own opening line.
    ctx = build_context()
    first = ctx.messages[0]
    assert _content(first) == "Hello!"


def _content(message) -> str:
    if isinstance(message, dict):
        return str(message.get("content", ""))
    return str(getattr(message, "content", ""))


def test_llm_carries_system_instruction():
    llm = build_llm(conversation_id="c1")
    instruction = llm._settings.system_instruction or ""
    assert "CEFR" in instruction
    assert llm._settings.extra == {}


def test_llm_uses_roleplay_prompt():
    from app.schemas import PersonaBody, ScenarioBody

    persona = PersonaBody(name="Sarah", roleTitle="Staff engineer")
    scenario = ScenarioBody(title="RFC defense", objective="Defend partitioning.", cefrLevel="C1")
    llm = build_llm(conversation_id="c1", persona=persona, scenario=scenario, level="C1")
    instruction = llm._settings.system_instruction or ""
    assert "Sarah" in instruction
    assert "RFC defense" in instruction
    assert "C1" in instruction


def test_llm_free_talk_unchanged():
    llm = build_llm(conversation_id="c1")
    instruction = llm._settings.system_instruction or ""
    assert "Flexi" in instruction
    assert "B1" in instruction
