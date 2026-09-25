"""Isolate engine tests from the developer's ambient `.env`.

`src/config.py` builds its `Settings` singleton at import time from the
environment (via pydantic-settings + `.env`). Without this, a developer's
real keys/overrides leak into the "defaults" assertions. Stub the required
keys, drop every optional override, before any test module imports `config`.
"""

import os

os.environ["DEEPGRAM_API_KEY"] = "test"
os.environ["OPENAI_API_KEY"] = "test"
os.environ["INTERNAL_SECRET"] = "test"

# Real environment variables win over the `.env` file in pydantic-settings,
# so pin every optional key to its default here. (Popping is not enough: the
# developer's `.env` file would supply the value instead.)
os.environ.update(
    {
        "OPENAI_BASE_URL": "https://api.openai.com/v1",
        "LLM_NAME": "gpt-4o-mini",
        "LLM_REASONING_EFFORT": "",
        "PIPER_VOICE": "en_US-lessac-high",
        "MODELS_DIR": "./models",
        "API_URL": "http://localhost:8000",
        "MAX_DURATION_SEC": "300",
        "IDLE_TIMEOUT_SEC": "300",
        "SENTRY_DSN": "",
    }
)
