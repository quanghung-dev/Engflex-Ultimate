"""Turn-batch ingestion callback: engine -> Go.

At-most-once, same contract as `go_callbacks.finalize_session`: a failed
batch is logged and dropped. Go makes replay safe (idempotent upsert on
`(conversation_id, position)`), so a manual re-post is always an option.
"""

import aiohttp
from loguru import logger

from config import settings
from transcript.capture import TurnRecord

INTERNAL_HEADER = "X-Internal-Secret"


def _serialize(records: list[TurnRecord]) -> dict[str, object]:
    return {
        "turns": [
            {
                "position": record.position,
                "role": record.role,
                "text": record.text,
                "wasInterrupted": record.was_interrupted,
            }
            for record in records
        ]
    }


async def post_turn_batch(conversation_id: str, records: list[TurnRecord]) -> bool:
    """POST the batch. Async end to end: the teardown call site
    (`on_pipeline_finished`) is already async and awaits `finalize_session`,
    so a sync wrapper with `asyncio.run` would only fight the running loop.
    Failures are logged, never raised (at-most-once, like `finalize_session`).
    """
    if not records:
        return True
    url = f"{settings.api_url}/api/v1/internal/conversations/{conversation_id}/turns"
    payload = _serialize(records)
    try:
        async with (
            aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=settings.turns_post_timeout_sec)
            ) as session,
            session.post(
                url, json=payload, headers={INTERNAL_HEADER: settings.internal_secret}
            ) as resp,
        ):
            # Same form as `go_callbacks.finalize_session`: raise, don't
            # inspect `resp.status` by hand.
            resp.raise_for_status()
        logger.info("turn batch sent", conversation_id=conversation_id, turns=len(records))
        return True
    except Exception:  # noqa: BLE001 - at-most-once by design
        logger.exception("turn batch failed", conversation_id=conversation_id)
        return False
