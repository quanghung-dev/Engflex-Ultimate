import aiohttp
from loguru import logger

from config import settings

INTERNAL_HEADER = "X-Internal-Secret"


async def finalize_session(conversation_id: str, duration_sec: int) -> None:
    """Report the session duration to Go. At-most-once: failures are logged."""
    url = (
        f"{settings.api_url}/api/v1/internal/conversations/"
        f"{conversation_id}/finalize"
    )
    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10)
        ) as session, session.post(
            url,
            json={"durationSec": duration_sec},
            headers={INTERNAL_HEADER: settings.internal_secret},
        ) as resp:
            resp.raise_for_status()
        logger.info("finalize sent", conversation_id=conversation_id)
    except Exception:  # noqa: BLE001 — at-most-once by design: any failure is logged, never raised
        logger.exception("finalize failed", conversation_id=conversation_id)
