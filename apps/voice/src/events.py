"""Pipeline and transport event wiring: greeting, session timer, errors, finalize.

Deviation from the brief (verified against installed pipecat-ai 1.11.0):
``on_client_connected`` / ``on_client_disconnected`` are transport events
(``SmallWebRTCTransport`` registers them; ``PipelineWorker`` only registers
``on_pipeline_*`` / ``on_frame_*`` / ``on_*_timeout`` and warns + drops
anything else). So this module takes the ``transport`` explicitly and
registers the client handlers on it. Behaviour is unchanged: greeting on
connect, session timer, fatal error surface, finalize callback on finish.
"""

import asyncio
import time

from loguru import logger
from pipecat.frames.frames import EndTaskFrame, EndWorkerFrame, ErrorFrame, LLMRunFrame
from pipecat.pipeline.worker import PipelineWorker
from pipecat.processors.frame_processor import FrameDirection
from pipecat.transports.base_transport import BaseTransport

from clients.go_callbacks import finalize_session
from schemas import RunnerBody


def get_custom_error_message(error: str, service_name: str = "Service") -> str:
    text = str(error)
    if "402" in text:
        return f"{service_name} unavailable: payment required."
    if "429" in text:
        return f"{service_name} unavailable: too many requests, try again soon."
    if "401" in text or "403" in text:
        return f"{service_name} unavailable: authentication failed."
    if "timeout" in text.lower() or "408" in text:
        return f"{service_name} timed out. Please try again."
    return f"{service_name} unavailable: an unexpected error occurred."


def register_event_handlers(
    worker: PipelineWorker,
    transport: BaseTransport,
    *,
    body: RunnerBody,
    start_time: float,
) -> None:
    timer_handle: dict[str, asyncio.Task] = {}

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_transport: BaseTransport, _client):
        logger.info("client connected", conversation_id=body.conversationId)
        # No context priming here: the session prompt travels via the LLM
        # service's system_instruction and the opener is seeded in
        # build_context, so the first run is exactly one system + one user
        # message — the shape this upstream accepts.
        await worker.queue_frames([LLMRunFrame()])

        async def session_timer():
            await asyncio.sleep(body.maxDuration)
            logger.info("max duration reached", conversation_id=body.conversationId)
            await worker.queue_frame(EndTaskFrame(), FrameDirection.UPSTREAM)

        timer_handle["task"] = asyncio.create_task(session_timer())

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport: BaseTransport, _client):
        logger.info("client disconnected", conversation_id=body.conversationId)
        if (pending := timer_handle.get("task")) is not None:
            pending.cancel()
        await worker.cancel()

    @worker.event_handler("on_pipeline_error")
    async def on_pipeline_error(_worker: PipelineWorker, frame):
        error_text = (
            frame.error if isinstance(frame, ErrorFrame) else str(frame)
        )
        # Transient blips (e.g. a single TTS context completing with no
        # audio on cold start) arrive with fatal=False and recover on their
        # own — pipecat only marks a processor unusable after repeated
        # ones. Ending the session here killed sessions that had already
        # recovered, so non-fatal frames are logged and left alone; only
        # fatal frames surface to the client and end the pipeline.
        if isinstance(frame, ErrorFrame) and not frame.fatal:
            logger.warning(
                "transient pipeline error; session continues", error=error_text
            )
            return
        message = get_custom_error_message(error_text)
        logger.error("pipeline error", error=error_text, message=message)
        # No `fatal=True` (deprecated since 1.8.0): the RTVI processor forwards
        # every ErrorFrame to the client, and EndWorkerFrame ends the pipeline
        # so on_pipeline_finished still finalizes the session.
        await worker.queue_frames([ErrorFrame(message), EndWorkerFrame()])

    @worker.event_handler("on_pipeline_finished")
    async def on_pipeline_finished(_worker: PipelineWorker, _frame):
        duration = int(time.time() - start_time)
        await finalize_session(body.conversationId, duration)
