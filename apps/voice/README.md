# EngFlex Voice Engine — Python Pipecat Service

Stateless realtime voice pipeline (STT → LLM → TTS over WebRTC). It owns the
conversation prompts and audio path; Go only provisions sessions and ingests
results afterwards. **Always run via `uv run`** (`pyproject.toml` + `uv.lock`).

## Layout

```
src/
  app/            # Runner routes + session schemas (PersonaBody, ScenarioBody, LearnerBody)
  pipeline/       # STT/LLM/TTS factories, bot tasks, handlers
  transcript/     # Capture + analyze (feedback spans/relevance/tip, pronunciation)
  clients/        # Go callbacks (turn batch ingest, at-most-once)
  prompts.py      # Free-talk + roleplay templates — the engine owns them
  bot.py          # Pipeline entry point
  config.py       # Role-named settings (stt/llm/voice, never vendors)
scripts/
  redteam_roleplay.py   # Prompt regression set — re-run after every prompt change
  make_fake_mic_audio.py# Offline fake-mic WAV for the live e2e fixture (piper-tts, network-free)
tests/                  # Pytest suites (120+ tests)
```

## Quickstart

```bash
uv run python src/bot.py   # entry point
uv run pytest -q           # tests (pythonpath=src)
uv run ruff check src tests
```

## Configuration (`.env`, key names only)

| Key | Role |
|-----|------|
| `STT_API_KEY` | Speech-to-text |
| `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | Chat model (any OpenAI-compatible endpoint) |
| `LLM_REASONING_EFFORT` | Extra top-level param (empty = not sent) |
| `TTS_API_KEY` / `VOICE_MODEL` | Speech synthesis model |
| `MALE_VOICE_ID` / `FEMALE_VOICE_ID` | Per-gender voice identity, selected by persona gender (empty = provider default) |
| `AUDIO_OUT_SAMPLE_RATE` | Must be accepted by the TTS engine (else silent failure) |
| `INTERNAL_SECRET` | Authenticates Go callbacks |
| `MAX_DURATION_SEC` / `IDLE_TIMEOUT_SEC` | Session bounds |
| `ANALYSIS_STRUCTURED_OUTPUT` | Force extraction fallback path when off |

## Conventions

- **Prompts are code:** `prompts.py` owns free-talk (Flexi, byte-stable) and the
  roleplay branch (persona/scenario + boundary rules: stay in role, no
  deliverables on demand, in-character redirect, meta-requests always allowed).
  `services.build_llm` caps replies at `max_tokens=200`.
- **Session LLM vs analysis LLM:** the streaming Pipecat service handles live
  turns; one-shot offline analysis goes through the `openai` SDK directly.
- **Feedback prompt** asks for exactly five keys (`corrected`, `spans`,
  `relevance`, `alternatives`, `tip`) — never phonemes on the text route.
- **Red-team before merge:** any prompt change must re-run
  `uv run python scripts/redteam_roleplay.py` (23 adversarial + legit cases)
  and show no new failures and no new false refusals on legit code discussion.
