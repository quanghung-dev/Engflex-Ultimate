"""Voice pipeline assembly: transport + STT/LLM/TTS + aggregators."""

from typing import cast

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators import llm_response_universal as agg
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.transports.base_transport import BaseTransport

from config import settings
from pipeline.services import build_llm, build_stt, build_tts
from transcript.capture import TurnCollector
from transcript.window import RecoveryUserMuteStrategy, TranscriptRecoveryProcessor


async def create_voice_bot_worker(
    transport: BaseTransport,
    context: LLMContext,
    *,
    max_duration: int,
    conversation_id: str,
    collector: TurnCollector,
) -> tuple[
    PipelineWorker,
    agg.LLMUserAggregator,
    agg.LLMAssistantAggregator,
    TranscriptRecoveryProcessor,
]:
    stt = build_stt()
    llm = build_llm(conversation_id=conversation_id)
    tts = build_tts()

    # Built first: the user aggregator's mute strategy reads the window's
    # state, so the pair cannot be constructed until `recovery` exists. The
    # window is opened by an HTTP command; nothing here is automatic.
    recovery = TranscriptRecoveryProcessor()
    # "Mic paused while clarifying" in pipecat's own terms: for as long as the
    # correction modal is open the aggregator mutes the learner's frames, so
    # nothing they say can add a turn or interrupt the tutor mid-sentence. The
    # tutor's own output is untouched.
    user_agg, assistant_agg = agg.LLMContextAggregatorPair(
        context,
        user_params=agg.LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),
            user_mute_strategies=[RecoveryUserMuteStrategy(recovery)],
        ),
    )

    # LLMContextAggregatorPair is typed as a union of both aggregator types;
    # the first element is always the user aggregator.
    user_aggregator = cast(agg.LLMUserAggregator, user_agg)
    assistant_aggregator = cast(agg.LLMAssistantAggregator, assistant_agg)

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            recovery,
            user_aggregator,
            llm,
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
            audio_in_sample_rate=16000,
            audio_out_sample_rate=settings.audio_out_sample_rate,
        ),
        idle_timeout_secs=settings.idle_timeout_sec,
        cancel_on_idle_timeout=False,
    )
    return worker, user_aggregator, assistant_aggregator, recovery
