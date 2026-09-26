"""In-memory transcript capture for one session.

The engine is the only writer of transcript turns (spec section 6), so it
collects everything here and posts one batch to Go at finalize. Consecutive
user fragments (STT finals that never triggered a bot reply) collapse into
one turn so the transcript reads like a conversation, not like STT chunks.

There is deliberately no audio field (D12) and no word-metadata field (D14).
The whole audio path -- in-memory buffer, provider call, discard -- is a P3
build that happens once a speech provider is chosen; word timings would be
superseded by that provider's own alignment.
"""

from dataclasses import dataclass


@dataclass
class TurnRecord:
    position: int
    role: str
    text: str
    was_interrupted: bool = False


class TurnCollector:
    def __init__(self) -> None:
        self._records: list[TurnRecord] = []
        self._open_user: TurnRecord | None = None

    def add_user_text(self, text: str, was_interrupted: bool = False) -> TurnRecord | None:
        cleaned = (text or "").strip()
        if not cleaned:
            return None
        if self._open_user is not None:
            self._open_user.text = f"{self._open_user.text} {cleaned}".strip()
            self._open_user.was_interrupted = self._open_user.was_interrupted or was_interrupted
            return self._open_user
        record = TurnRecord(
            position=self._next_position(),
            role="user",
            text=cleaned,
            was_interrupted=was_interrupted,
        )
        self._records.append(record)
        self._open_user = record
        return record

    def add_bot_text(self, text: str, was_interrupted: bool = False) -> TurnRecord | None:
        cleaned = (text or "").strip()
        if not cleaned:
            return None
        self._open_user = None
        record = TurnRecord(
            position=self._next_position(),
            role="ai",
            text=cleaned,
            was_interrupted=was_interrupted,
        )
        self._records.append(record)
        return record

    def records(self) -> list[TurnRecord]:
        return list(self._records)

    def clear(self) -> None:
        self._records.clear()
        self._open_user = None

    def _next_position(self) -> int:
        return len(self._records) + 1
