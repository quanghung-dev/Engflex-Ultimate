"""Wiring test: importing the bot entrypoint must register /analyze.

Regression guard: `import routes` in bot.py is a side-effect import, and an
over-eager `ruff check --fix` once deleted it as "unused" (F401) — the route
vanished from the served app while every route-level test kept passing (they
import routes directly). This test imports bot the way production does and
asserts on the shared runner app.
"""

from pipecat.runner.run import app

import bot  # noqa: F401 -- imported for the side effect under test


def test_bot_import_registers_analyze_route():
    paths = [route.path for route in app.routes]
    assert "/analyze" in paths
