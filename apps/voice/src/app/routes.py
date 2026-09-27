"""Non-session HTTP routes mounted on the pipecat runner's FastAPI app.

The dev runner only serves session endpoints (`/start`, per-session WebRTC)
out of the box. Anything session-independent — like one-shot turn analysis —
is registered here via the runner's shared `app` singleton, which must be
imported before `pipecat.runner.run.main()` runs (see `bot.py`).
"""

from fastapi import HTTPException
from loguru import logger

# Named for what it is: the runner's FastAPI singleton, not our app package.
from pipecat.runner.run import app as runner_app
from pydantic import ValidationError

from analysis import AnalysisRefused, AnalyzeRequest, analyze_turn
from app.schemas import TranscriptCommandBody


@runner_app.post("/analyze")
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


# --- Transcript commands -----------------------------------------------------
# All four are learner-initiated and session-scoped. Each refuses with its own
# status (404 no live session, 409 nothing to act on, 422 unusable input) and
# lets anything unexpected become a 500, mirroring /analyze above.


@runner_app.post("/transcript")
async def transcript(req: TranscriptCommandBody):
    """One learner-initiated transcript command.

    The four actions (review / retake / send / dismiss) are one state machine,
    so they are one endpoint. Each refuses with its own status: 404 no live
    session, 409 illegal for the current state, 422 unusable text.
    """
    from transcript.command import run_action

    try:
        return await run_action(req.conversationId, req.action, req.text)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("transcript command failed")
        raise HTTPException(status_code=500, detail="transcript command failed") from exc
