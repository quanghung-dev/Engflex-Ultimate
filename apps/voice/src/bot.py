import time

from loguru import logger
from pipecat.runner.types import RunnerArguments, SmallWebRTCRunnerArguments
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport

from events import register_event_handlers
from observability import bind_session, init_sentry
from pipeline.services import build_context
from pipeline.tasks import create_voice_bot_worker
from schemas import RunnerBody

init_sentry()


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
    worker = await create_voice_bot_worker(
        transport,
        context,
        max_duration=body.maxDuration,
        conversation_id=body.conversationId,
    )
    register_event_handlers(
        worker, transport, body=body, start_time=start_time
    )

    from pipecat.workers.runner import WorkerRunner

    runner = WorkerRunner(handle_sigint=False)
    await runner.add_workers(worker)
    await runner.run()
    log.info("session finished", duration_sec=int(time.time() - start_time))


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
