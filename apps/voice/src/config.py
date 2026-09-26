from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Providers
    deepgram_api_key: str
    openai_api_key: str
    openai_base_url: str = "https://api.openai.com/v1"
    llm_name: str = "gpt-4o-mini"
    # Extra top-level chat-completions param (e.g. reasoning_effort=none for
    # reasoning models). Empty = not sent. Pipecat merges Settings.extra
    # into the request params verbatim.
    llm_reasoning_effort: str = ""
    # Client identity for proxied OpenAI-compatible endpoints that require
    # it (e.g. opencode.ai/zen: custom user agent + per-session header).
    opencode_user_agent: str = "engflex-voice/0.1"

    # TTS
    piper_voice: str = "en_US-lessac-high"
    models_dir: str = "./models"

    # Go control plane
    api_url: str = "http://localhost:8000"
    internal_secret: str

    # Session
    max_duration_sec: int = 300
    idle_timeout_sec: int = 300
    # Turn batch callback to Go (at-most-once; a failed batch is dropped).
    turns_post_timeout_sec: int = 30

    # Analysis (a separate SDK client: the session's LLM service is streaming).
    analyze_timeout_sec: int = 60
    analyze_session_prefix: str = "engflex-analyze"
    # Turn off to force the extraction path without a code change (D19).
    analysis_structured_output: bool = True

    # Observability (optional)
    sentry_dsn: str = ""


settings = Settings()
