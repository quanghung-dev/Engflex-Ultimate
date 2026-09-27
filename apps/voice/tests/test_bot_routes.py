"""Wiring tests for the bot entrypoint: it registers routes, and it reads env
before anything else gets a chance to overwrite it.

Two independent regression guards, both about import wiring in `bot.py`:

1. The route import is a side-effect import, and an over-eager `ruff check --fix`
   once deleted it as "unused" (F401) — the route vanished from the served app
   while every route-level test kept passing (they import the routes module
   directly). This test imports bot the way production does and asserts on the
   runner's shared app.
2. `settings` must be constructed before pipecat.runner.run's
   `load_dotenv(override=True)`. That ordering was once incidental (isort
   happened to sort `from config import ...` first); renaming the routes module
   to `app` made `app` sort first, and the live e2e then silently talked to
   `.env`'s API_URL instead of the test's. That is why it is now enforced with
   an `isort: off` region, and this test is what keeps the enforcement honest.
"""

import os
import subprocess
import sys
from pathlib import Path

from fastapi.routing import APIRoute

# Named for what it is: the runner's FastAPI singleton, not our app package.
from pipecat.runner.run import app as runner_app

import bot  # noqa: F401 -- imported for the side effect under test

SRC = Path(__file__).resolve().parents[1] / "src"


def test_bot_import_registers_analyze_route():
    paths = [route.path for route in runner_app.routes if isinstance(route, APIRoute)]
    assert "/analyze" in paths


def test_process_env_beats_dotenv_when_bot_is_imported(tmp_path):
    """`.env` must not clobber a process-supplied API_URL.

    Runs in a subprocess: `settings` is built at import time, so the only honest
    way to test the ordering is to start a fresh interpreter. The temp cwd holds
    a `.env` that disagrees with the process env on purpose.
    """
    (tmp_path / ".env").write_text(
        "STT_API_KEY=x\nTTS_API_KEY=y\nINTERNAL_SECRET=z\nAPI_URL=http://from-dotenv:9999\n"
    )
    result = subprocess.run(
        [sys.executable, "-c", "import bot; from config import settings; print(settings.api_url)"],
        cwd=tmp_path,
        env={**os.environ, "PYTHONPATH": str(SRC), "API_URL": "http://from-process:1234"},
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    assert result.returncode == 0, result.stderr
    assert "http://from-process:1234" in result.stdout, result.stdout
