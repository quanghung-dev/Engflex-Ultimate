"""The transform that rewrites the turn under review.

Pure function. No note, no rebuilt list, nothing touched that we did not mean to
touch: pipecat hands us the live message list, so anything we do not rewrite
passes through by reference.
"""

from collections.abc import Sequence
from typing import Any


def replace_last_user_message(messages: Sequence[Any], corrected_text: str) -> list[Any] | None:
    """Return the list with the last user turn replaced and later turns dropped.

    Everything from the last `role == "user"` message onwards is replaced: that
    turn's content becomes `corrected_text`, and the assistant reply it produced
    (plus anything after it) is dropped, because it answered text that no longer
    exists.

    There is deliberately no note telling the model its previous reply was void.
    The stale reply is gone from the context, so there is nothing to disregard;
    the note also contradicted the tutor's own system prompt ("do not interrupt
    or correct mid-conversation"), and the learner never experienced a
    mishearing — they heard an odd answer and fixed the text.

    Returns None when there is no user message to correct, so the caller can
    refuse rather than edit the wrong turn. The input is never mutated, and
    messages before the target pass through by reference.
    """
    target = -1
    for index, message in enumerate(messages):
        if isinstance(message, dict) and message.get("role") == "user":
            target = index
    if target < 0:
        return None
    return [*messages[:target], {"role": "user", "content": corrected_text}]


def last_user_text(messages: Sequence[Any]) -> str | None:
    """The text of the last user message, or None when there is not one."""
    for message in reversed(messages):
        if isinstance(message, dict) and message.get("role") == "user":
            content = message.get("content")
            return content if isinstance(content, str) else None
    return None
