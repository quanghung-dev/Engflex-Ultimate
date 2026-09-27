"""The transcript command: one endpoint, four actions, one window.

Everything here acts on a live session and is reached from an HTTP route that Go
proxies. There is one operation: **rewriting** the turn under review. The field
holds one sentence however the learner filled it, so typing it and speaking it
mean the same thing — the turn's text is replaced, everything after it is
dropped, and inference re-runs so the tutor answers the new words.

Nothing here reads STT confidence. It no longer decides anything.
"""

from typing import Any

from fastapi import HTTPException
from loguru import logger
from pipecat.frames.frames import (
    InterruptionFrame,
    LLMMessagesTransformFrame,
)

from transcript.correction import replace_last_user_message
from transcript.sessions import SessionControl, get
from transcript.window import RecoveryState

# A correction is a sentence or two, not an essay; the cap stops a paste from
# becoming a context bomb.
MAX_CORRECTION_CHARS = 2000

ACTIONS = ("review", "retake", "send", "dismiss")


def require_session(conversation_id: str) -> SessionControl:
    control = get(conversation_id)
    if control is None:
        raise HTTPException(status_code=404, detail="no live session")
    return control


# --- actions -----------------------------------------------------------------


def _review(control: SessionControl) -> dict[str, Any]:
    """Open the window on the latest learner turn and hand back its text."""
    record = control.collector.latest_user_record()
    if record is None:
        raise HTTPException(status_code=409, detail="no user turn to review")
    control.recovery.open(record.position)
    logger.info(f"transcript_window_opened position={record.position}")
    return {"state": control.recovery.state.value, "text": record.text}


def _retake(control: SessionControl) -> dict[str, Any]:
    """Listen for the next utterance instead of committing it."""
    try:
        control.recovery.start_listening()
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    logger.info("transcript_listening_started")
    return {"state": control.recovery.state.value}


def _dismiss(control: SessionControl) -> dict[str, Any]:
    """Close the window. Records nothing — the utterance was never kept."""
    control.recovery.close()
    return {"state": control.recovery.state.value}


async def _send(control: SessionControl, text: str) -> dict[str, Any]:
    cleaned = (text or "").strip()
    if not cleaned:
        raise HTTPException(status_code=422, detail="empty text")
    if len(cleaned) > MAX_CORRECTION_CHARS:
        raise HTTPException(status_code=422, detail="text too long")

    # There is one operation, not two. The field holds one sentence however it
    # was filled, so a spoken correction and a typed one both mean "this is what
    # I said", and both replace the turn under review.
    if control.recovery.state not in (RecoveryState.REVIEWING, RecoveryState.HOLDING):
        raise HTTPException(status_code=409, detail="no correction in progress")
    return await _rewrite(control, cleaned)


# --- the operation ------------------------------------------------------------


async def _rewrite(control: SessionControl, cleaned: str) -> dict[str, Any]:
    """Rewrite the reviewed turn in place and regenerate the tutor's reply."""
    # The window remembers which turn the learner is looking at. Normally it is
    # also the latest, because the learner's mic is muted for the whole window
    # so no new turn can land underneath the modal. Verify rather than assume:
    # rewriting "whatever is newest" is how a correction lands on the wrong
    # turn, which is the one failure this design exists to prevent.
    target_position = control.recovery.target_position
    record = next(
        (
            r
            for r in control.collector.records()
            if r.position == target_position and r.role == "user"
        ),
        None,
    )
    if record is None:
        raise HTTPException(status_code=409, detail="the reviewed turn is gone")
    if cleaned == record.text:
        # Re-sending what we already have must not spend an LLM run and a
        # spoken reply, so refuse instead of regenerating the same answer.
        raise HTTPException(status_code=422, detail="text unchanged")
    if control.collector.latest_user_record() is not record:
        # Something committed after the window opened. Refuse: the learner is
        # looking at one turn and we would rewrite another.
        raise HTTPException(status_code=409, detail="a newer turn was committed")

    position = control.collector.begin_correction(cleaned)
    if position is None:  # pragma: no cover - record exists a line above
        raise HTTPException(status_code=409, detail="no user turn to correct")

    # The in-flight reply answered text that no longer exists. A no-op when the
    # tutor already finished.
    await control.worker.queue_frame(InterruptionFrame())
    # A transform, not a rebuilt list: pipecat calls it with the LIVE messages
    # when the frame is processed, so the rewrite cannot race a turn that
    # landed after we read the collector, and anything we do not touch (an
    # LLM-specific message, a future type) passes through untouched.
    await control.worker.queue_frame(
        LLMMessagesTransformFrame(transform=_correction_transform(cleaned), run_llm=True)
    )
    await _repost_corrected(control, position)
    # The window is over: leaving it open would keep the learner muted for the
    # rest of the session.
    control.recovery.close()
    logger.info(f"transcript_corrected position={position} chars={len(cleaned)}")
    return {"state": control.recovery.state.value, "text": cleaned}


def _correction_transform(corrected_text: str) -> Any:
    """The transform the aggregator applies to its own message list."""

    def transform(messages: list[Any]) -> list[Any]:
        rebuilt = replace_last_user_message(messages, corrected_text)
        # Nothing to correct: leave the history alone rather than truncating it.
        return messages if rebuilt is None else rebuilt

    return transform


async def _repost_corrected(control: SessionControl, position: int) -> None:
    """Re-send the corrected turn. At-most-once like every other turn post: a
    failure is logged and dropped, because the teardown flush carries the same
    corrected record anyway."""
    from clients.go_turns import post_turn_batch

    record = next((r for r in control.collector.records() if r.position == position), None)
    if record is None:  # pragma: no cover - begin_correction just wrote it
        return
    try:
        await post_turn_batch(control.conversation_id, [record])
    except Exception:  # noqa: BLE001 - at-most-once, same as finalize
        logger.warning(f"transcript_repost_failed position={position}")


# --- dispatch ----------------------------------------------------------------


async def run_action(conversation_id: str, action: str, text: str | None) -> dict[str, Any]:
    """Apply one command. Each action refuses with its own status: 404 no live
    session, 409 illegal for the current state, 422 unusable text."""
    if action not in ACTIONS:
        raise HTTPException(status_code=422, detail="unknown action")
    control = require_session(conversation_id)
    match action:
        case "review":
            return _review(control)
        case "retake":
            return _retake(control)
        case "dismiss":
            return _dismiss(control)
        case "send":
            return await _send(control, text or "")
    raise HTTPException(status_code=422, detail="unknown action")  # pragma: no cover
