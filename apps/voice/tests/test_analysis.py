from typing import Any

import pytest
from pydantic import ValidationError

from analysis import (
    AnalyzeRequest,
    ContextTurn,
    TurnFeedback,
    _messages,
    build_feedback_prompt,
    extract_json_object,
    parse_feedback,
)


def _request() -> AnalyzeRequest:
    return AnalyzeRequest(
        conversationId="c1",
        turnId="t1",
        text="I go to the office yesterday.",
        context=[ContextTurn(role="ai", text="What did you do yesterday?")],
    )


def test_messages_include_a_user_message():
    # The upstream provider rejects requests with no user message (the same
    # 400 that killed the greeting turn before the "Hello!" opener). The
    # system prompt already carries the utterance; the user message repeats
    # it as the review target so the request is never system-only.
    messages = _messages(_request())
    assert messages[0].get("role") == "system"
    user = [m for m in messages if m.get("role") == "user"]
    assert len(user) == 1
    assert "yesterday" in str(user[0].get("content", ""))


def test_prompt_demands_the_four_keys():
    prompt = build_feedback_prompt(_request())
    for key in ("annotated", "marks", "upgrades", "tip"):
        assert key in prompt
    assert "yesterday" in prompt


def test_prompt_never_asks_for_phonemes():
    # Phonemes are an acoustic measurement nothing currently produces. The
    # contract must not ask for them, or the model invents scores.
    assert "phoneme" not in build_feedback_prompt(_request()).lower()


def test_prompt_never_asks_for_a_speech_block():
    assert "speech" not in build_feedback_prompt(_request()).lower()


def test_prompt_carries_no_level_or_objective():
    # The conversation context already expresses the topic; the ask is simply
    # "is this correct English", which does not vary by level.
    req = AnalyzeRequest(conversationId="c1", turnId="t1", text="hello")
    prompt = build_feedback_prompt(req)
    assert "cefr" not in prompt.lower()
    assert "objective" not in prompt.lower()


def test_extract_returns_a_bare_object():
    raw = '{"annotated": "a", "marks": [], "upgrades": [], "tip": "t"}'
    assert extract_json_object(raw) == raw


def test_extract_ignores_prose_around_the_object():
    raw = 'Sure!\n{"annotated": "a"}\nHope that helps.'
    assert extract_json_object(raw) == '{"annotated": "a"}'


def test_extract_raises_when_there_is_no_json_block():
    with pytest.raises(ValueError):
        extract_json_object("**Corrected sentence:** I went to the office.")


def test_parse_validates_a_clean_object():
    fb = parse_feedback(
        '{"annotated": "I went yesterday.", "marks": [], "upgrades": [], "tip": "past"}'
    )
    assert fb.annotated == "I went yesterday."
    assert fb.marks == []


def test_parse_survives_a_bolded_reply():
    # The model ignores response_format on this route and answers in
    # markdown with a JSON object inside.
    raw = (
        "**Corrected sentence:** I **went** to the office yesterday.\n\n"
        '{"annotated": "I went yesterday.", "marks": [], "upgrades": [], "tip": "past"}'
    )
    assert parse_feedback(raw).tip == "past"


def test_parse_raises_on_an_unexpected_shape():
    with pytest.raises(ValidationError):
        parse_feedback('{"annotated": "a", "tip": "t"}')  # marks/upgrades missing


def test_parse_raises_when_a_mark_has_an_unknown_status():
    with pytest.raises(ValidationError):
        parse_feedback(
            '{"annotated": "a", "marks": [{"word": "go", "status": "great"}],'
            ' "upgrades": [], "tip": "t"}'
        )


def test_models_derive_a_valid_strict_schema():
    # Regression guard for the structured-output path. The SDK derives the
    # schema from the pydantic models, and strict mode has two traps that are
    # easy to reintroduce by hand: every property must appear in `required`,
    # and `additionalProperties: false` must be set on nested objects too.
    # TurnFeedback deliberately declares no defaults -- a default would let
    # the model and its own derived schema disagree about what is required.
    # Verified against openai 3.19.2.
    from openai.lib._parsing._completions import type_to_response_format_param

    # The helper returns a union of response-format TypedDicts; the JSON
    # schema variant is the one this test inspects.
    response_format: Any = type_to_response_format_param(TurnFeedback)
    param: dict[str, Any] = response_format["json_schema"]
    schema: dict[str, Any] = param["schema"]

    assert param["strict"] is True
    assert set(schema["required"]) == {"annotated", "marks", "upgrades", "tip"}
    assert schema["additionalProperties"] is False
    defs: dict[str, Any] = schema["$defs"]
    for name, definition in defs.items():
        assert definition["additionalProperties"] is False, f"{name} must forbid extras"
    assert "$schema" not in schema
