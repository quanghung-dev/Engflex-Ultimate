import os
import time

from loguru import logger
from pipecat.runner.types import RunnerArguments, SmallWebRTCRunnerArguments
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport

# NOTE (import order is load-bearing): `from config import settings` MUST stay
# the first local import. pipecat.runner.run calls load_dotenv(override=True)
# at import time, which overwrites process-supplied env (e.g. Playwright's
# API_URL) with .env values; our Settings must be constructed before that
# happens. (Importing pipecat.runner.types / transports is safe: the runner
# package __init__ does not pull in run.py.) isort keeps this order stable:
# `from config import ...` sorts before the other from-imports, and the routes
# side-effect import below uses from-form for the same reason (a plain
# `import routes` would sort first and reintroduce the bug).
from config import settings
from events import register_event_handlers
from observability import bind_session, init_sentry
from pipeline.services import build_context
from pipeline.tasks import create_voice_bot_worker
from routes import analyze  # noqa: F401 -- side effect: registers /analyze on the runner app
from schemas import RunnerBody
from turns import TurnCollector

init_sentry()

# Non-secret effective config, one line at boot. Values are interpolated into
# the message (not kwargs) because the log format does not render extras.
# The env-vs-settings pair catches env poisoning (see the import-order note
# above) directly in the run log.
logger.info(
    f"engine config api_url={settings.api_url} "
    f"llm={settings.llm_name} sentry={bool(settings.sentry_dsn)} "
    f"env_API_URL={os.environ.get('API_URL')!r}"
)


async def bot(runner_args: RunnerArguments):
    if not isinstance(runner_args, SmallWebRTCRunnerArguments):
        logger.error("unsupported runner args", kind=type(runner_args).__name__)
        return
    if not runner_args.body:
        raise ValueError("runner body is required")

    body = RunnerBody.model_validate(runner_args.body)
    log = bind_session(body.userId, body.conversationId)
    log.info("session starting", max_duration=body.maxDuration)

    transport: BaseTransport = SmallWebRTCTransport(
        webrtc_connection=runner_args.webrtc_connection,
        params=TransportParams(audio_in_enabled=True, audio_out_enabled=True),
    )

    start_time = time.time()
    context = build_context()
    collector = TurnCollector()
    worker, user_aggregator, assistant_aggregator = await create_voice_bot_worker(
        transport,
        context,
        max_duration=body.maxDuration,
        conversation_id=body.conversationId,
        collector=collector,
    )
    register_event_handlers(
        worker,
        transport,
        user_aggregator,
        assistant_aggregator,
        body=body,
        start_time=start_time,
        collector=collector,
    )

    from pipecat.workers.runner import WorkerRunner

    runner = WorkerRunner(handle_sigint=False)
    await runner.add_workers(worker)
    await runner.run()
    log.info("session finished", duration_sec=int(time.time() - start_time))


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
