import sentry_sdk
from loguru import logger
from pipecat.processors.metrics.sentry import SentryMetrics

from config import settings


def init_sentry() -> None:
    """Initialise Sentry once, only when a DSN is configured."""
    if not settings.sentry_dsn:
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=1.0,
        enable_logs=True,
        send_default_pii=False,
    )


def get_metrics() -> SentryMetrics | None:
    """Pipecat pipeline metrics sink; None when Sentry is disabled."""
    return SentryMetrics() if settings.sentry_dsn else None


def bind_session(user_id: str, conversation_id: str):
    """Return a logger bound to the session, and tag Sentry when enabled."""
    if settings.sentry_dsn:
        sentry_sdk.set_user({"id": user_id})
        sentry_sdk.set_context("voice_session", {"conversation_id": conversation_id})
    return logger.bind(area="voice", user_id=user_id, conversation_id=conversation_id)
