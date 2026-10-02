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
]:
    stt = build_stt()
    llm = build_llm(conversation_id=conversation_id)
    tts = build_tts()

    user_agg, assistant_agg = agg.LLMContextAggregatorPair(
        context,
        user_params=agg.LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(),
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
    return worker, user_aggregator, assistant_aggregator
