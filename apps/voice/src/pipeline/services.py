"""Pipecat service builders: STT, LLM, TTS, and LLM context."""

from pathlib import Path

from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.piper.tts import PiperTTSService

from config import settings
from observability import get_metrics
from prompts import build_system_prompt


def build_stt() -> DeepgramSTTService:
    # 1.11.0 moved interim_results/punctuate/endpointing into Settings
    # (direct kwargs no longer exist; live_options is deprecated).
    return DeepgramSTTService(
        api_key=settings.deepgram_api_key,
        settings=DeepgramSTTService.Settings(
            interim_results=True,
            punctuate=False,
            endpointing=300,
        ),
        metrics=get_metrics(),
    )


def build_llm(*, conversation_id: str | None = None) -> OpenAILLMService:
    extra = (
        {"reasoning_effort": settings.llm_reasoning_effort} if settings.llm_reasoning_effort else {}
    )
    headers = {"User-Agent": settings.opencode_user_agent}
    if conversation_id:
        # Stable per-conversation session id for proxied endpoints that use
        # it for routing / prompt caching (e.g. opencode.ai x-opencode-session).
        headers["x-opencode-session"] = conversation_id
    return OpenAILLMService(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
        settings=OpenAILLMService.Settings(
            model=settings.llm_name,
            extra=extra,
            system_instruction=build_system_prompt(),
        ),
        default_headers=headers,
        metrics=get_metrics(),
    )


def build_tts() -> PiperTTSService:
    # 1.11.0 renamed voice= to voice_id= and types download_dir as Path.
    return PiperTTSService(
        download_dir=Path(settings.models_dir),
        voice_id=settings.piper_voice,
        metrics=get_metrics(),
    )


def build_context() -> LLMContext:
    # One seeded user opener, zero system messages. Two constraints from the
    # upstream provider (probed 2026-09-25): it rejects requests with no user
    # message (the greeting turn died with 400), and stuffing the prompt into
    # the context is deprecated since pipecat 1.9 — the tutor prompt travels
    # via the LLM service's system_instruction instead (single system message).
    # The opener is a bare greeting on purpose: anything more specific makes
    # the model *reply* to it ("No problem—…") instead of delivering its own
    # opening line.
    return LLMContext(messages=[{"role": "user", "content": "Hello!"}])
