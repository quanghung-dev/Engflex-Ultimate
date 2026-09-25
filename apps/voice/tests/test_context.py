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
    assert [m["role"] for m in ctx.messages] == ["user"]


def test_llm_carries_system_instruction():
    llm = build_llm(conversation_id="c1")
    assert "CEFR" in llm._settings.system_instruction
    assert llm._settings.extra == {}
