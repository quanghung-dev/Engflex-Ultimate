"""The transform that rewrites the turn under review.

The point of these assertions is what the function does NOT do: it appends no
note, and it does not rebuild a list it does not fully understand. Pipecat hands
us the live message list, so anything we do not rewrite must survive by
reference.
"""

from dataclasses import dataclass

from transcript.correction import last_user_text, replace_last_user_message


@dataclass
class _LlmSpecific:
    """Stands in for pipecat's LLMSpecificMessage, which is not a Mapping."""

    llm: str
    message: dict[str, object]


def test_no_user_turn_returns_none():
    assert replace_last_user_message([{"role": "system", "content": "s"}], "x") is None
    assert replace_last_user_message([], "x") is None


def test_replaces_the_last_user_turn_and_drops_the_stale_reply():
    assert replace_last_user_message(
        [
            {"role": "user", "content": "Hello!"},
            {"role": "user", "content": "i go yesterday"},
            {"role": "assistant", "content": "so you went"},
        ],
        "i went yesterday",
    ) == [
        {"role": "user", "content": "Hello!"},
        {"role": "user", "content": "i went yesterday"},
    ]


def test_drops_every_turn_after_the_target():
    assert replace_last_user_message(
        [
            {"role": "user", "content": "Hello!"},
            {"role": "user", "content": "first"},
            {"role": "assistant", "content": "a"},
            {"role": "user", "content": "second"},
            {"role": "assistant", "content": "b"},
        ],
        "second corrected",
    ) == [
        {"role": "user", "content": "Hello!"},
        {"role": "user", "content": "first"},
        {"role": "assistant", "content": "a"},
        {"role": "user", "content": "second corrected"},
    ]


def test_appends_no_correction_note():
    # The note contradicted the tutor's own system prompt ("do not interrupt or
    # correct mid-conversation") and the learner never experienced a mishearing,
    # so any trailing message the model did not write is a bug.
    got = replace_last_user_message([{"role": "user", "content": "i go"}], "i went")
    assert got is not None
    assert got[-1] == {"role": "user", "content": "i went"}
    assert all(m.get("role") != "developer" for m in got if isinstance(m, dict))


def test_untouched_messages_pass_through_by_reference():
    # An LLM-specific message is not a Mapping. Rebuilding the list would drop
    # it from history; a transform must leave it alone.
    specific = _LlmSpecific(llm="openai", message={"role": "assistant"})
    got = replace_last_user_message([specific, {"role": "user", "content": "i go"}], "i went")
    assert got is not None
    assert got[0] is specific, "the LLM-specific message was rebuilt or dropped"


def test_does_not_mutate_the_input():
    messages = [
        {"role": "user", "content": "i go"},
        {"role": "assistant", "content": "so you went"},
    ]
    replace_last_user_message(messages, "i went")
    assert messages[0] == {"role": "user", "content": "i go"}


def test_last_user_text_reads_the_newest_turn():
    messages = [
        {"role": "user", "content": "first"},
        {"role": "assistant", "content": "a"},
        {"role": "user", "content": "second"},
    ]
    assert last_user_text(messages) == "second"
    assert last_user_text([{"role": "assistant", "content": "a"}]) is None
