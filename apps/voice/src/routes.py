"""Non-session HTTP routes mounted on the pipecat runner's FastAPI app.

The dev runner only serves session endpoints (`/start`, per-session WebRTC)
out of the box. Anything session-independent — like one-shot turn analysis —
is registered here via the runner's shared `app` singleton, which must be
imported before `pipecat.runner.run.main()` runs (see `bot.py`).
"""

from fastapi import HTTPException
from loguru import logger
from pipecat.runner.run import app
from pydantic import ValidationError

from analysis import AnalysisRefused, AnalyzeRequest, analyze_turn


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """Analyze one learner turn. Any failure surfaces as an HTTP error; Go
    maps non-2xx to a per-turn error and never stores partial feedback."""
    try:
        feedback = await analyze_turn(req)
    except AnalysisRefused as exc:
        logger.warning("analysis refused", reason=str(exc)[:200])
        raise HTTPException(status_code=422, detail="analysis refused") from exc
    except (ValueError, ValidationError) as exc:
        logger.warning("analysis reply unusable", error=str(exc)[:200])
        raise HTTPException(status_code=422, detail="analysis reply unusable") from exc
    except Exception as exc:
        logger.exception("analysis failed")
        raise HTTPException(status_code=500, detail="analysis failed") from exc
    return {"feedback": feedback.model_dump()}
