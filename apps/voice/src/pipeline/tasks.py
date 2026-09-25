"""Voice pipeline assembly: transport + STT/LLM/TTS + aggregators."""

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.transports.base_transport import BaseTransport

from config import settings
from pipeline.services import build_llm, build_stt, build_tts


async def create_voice_bot_worker(
    transport: BaseTransport,
    context: LLMContext,
    *,
    max_duration: int,
    conversation_id: str,
) -> PipelineWorker:
    stt = build_stt()
    llm = build_llm(conversation_id=conversation_id)
    tts = build_tts()

    # Module listing (1.11.0) confirms llm_response_universal + pair names.
    from pipecat.processors.aggregators import llm_response_universal as agg

    user_aggregator, assistant_aggregator = agg.LLMContextAggregatorPair(
        context,
        user_params=agg.LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
    )

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
            audio_out_sample_rate=22050,
        ),
        idle_timeout_secs=settings.idle_timeout_sec,
        cancel_on_idle_timeout=False,
    )
    return worker
