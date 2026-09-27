"""Pipecat service builders: STT, LLM, TTS, and LLM context.

STT and TTS return pipecat's service base classes: which provider serves a
role is configuration (`STT_API_KEY`, `VOICE_MODEL`), so callers should
not depend on a vendor type. The LLM builder stays concrete — see below.
"""

from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.fish.tts import FishAudioTTSService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.stt_service import STTService
from pipecat.services.tts_service import TTSService

from config import settings
from observability import get_metrics
from prompts import build_system_prompt


def build_stt() -> STTService:
    # 1.11.0 moved interim_results/punctuate/endpointing into Settings
    # (direct kwargs no longer exist; live_options is deprecated).
    return DeepgramSTTService(
        api_key=settings.stt_api_key,
        settings=DeepgramSTTService.Settings(
            interim_results=True,
            punctuate=False,
            endpointing=300,
        ),
        metrics=get_metrics(),
    )


def build_llm(*, conversation_id: str | None = None) -> OpenAILLMService:
    # The LLM return type stays concrete: `LLMService` is generic over its
    # adapter and that parameter is invariant, so the base class cannot
    # describe a provider without naming one. OpenAI-compatible is the
    # interface we drive (any gateway speaking it works via LLM_BASE_URL).
    extra = (
        {"reasoning_effort": settings.llm_reasoning_effort} if settings.llm_reasoning_effort else {}
    )
    headers = {"User-Agent": settings.llm_user_agent}
    if conversation_id:
        # Stable per-conversation session id for proxied endpoints that use
        # it for routing / prompt caching (e.g. opencode.ai x-opencode-session).
        headers["x-opencode-session"] = conversation_id
    return OpenAILLMService(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        settings=OpenAILLMService.Settings(
            model=settings.llm_model,
            extra=extra,
            system_instruction=build_system_prompt(),
        ),
        default_headers=headers,
        metrics=get_metrics(),
    )


def build_tts() -> TTSService:
    # Hosted TTS: VOICE_MODEL is the synthesis model, VOICE_ID the optional
    # voice identity. Both are provider-neutral names — nothing here names a
    # vendor, so pointing at a different engine is a config change.
    return FishAudioTTSService(
        api_key=settings.tts_api_key,
        settings=FishAudioTTSService.Settings(
            model=settings.voice_model,
            voice=settings.voice_id or None,
        ),
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
