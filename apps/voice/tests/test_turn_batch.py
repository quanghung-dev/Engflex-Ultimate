import asyncio

from clients import go_turns
from transcript.capture import TurnCollector


class _FakeResponse:
    """Mimics the slice of aiohttp's response the client reads."""

    def __init__(self, status: int):
        self.status = status

    def raise_for_status(self) -> None:
        if self.status >= 300:
            raise FakeHttpError(self.status)


class FakeHttpError(Exception):
    def __init__(self, status: int):
        super().__init__(f"HTTP {status}")
        self.status = status


class _PostCtx:
    def __init__(self, url, payload, status):
        self._url = url
        self._payload = payload
        self._status = status

    async def __aenter__(self):
        return _FakeResponse(self._status)

    async def __aexit__(self, *exc):
        return False


class _FakeSession:
    def __init__(self, captured, status=200, explode=None):
        self._captured = captured
        self._status = status
        self._explode = explode

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def post(self, url, json=None, headers=None, timeout=None):
        if self._explode is not None:
            raise self._explode
        self._captured.url = url
        self._captured.payload = json
        return _PostCtx(url, json, self._status)


class _Captured:
    def __init__(self) -> None:
        self.url = ""
        self.payload = {}


def _one_user_turn() -> TurnCollector:
    c = TurnCollector()
    c.add_user_text("hello there")
    return c


def _run(coro):
    # post_turn_batch is async end to end; drive it the same way production
    # does (awaited from a running loop is equivalent for these fakes).
    return asyncio.run(coro)


def test_batch_payload_shape(monkeypatch):
    captured = _Captured()
    monkeypatch.setattr(go_turns.aiohttp, "ClientSession", lambda **kw: _FakeSession(captured))

    assert _run(go_turns.post_turn_batch("conv-1", _one_user_turn().records())) is True

    assert captured.url.endswith("/api/v1/internal/conversations/conv-1/turns")
    assert captured.payload["turns"] == [
        {"position": 1, "role": "user", "text": "hello there", "wasInterrupted": False}
    ]


def test_interrupted_bot_turn_is_flagged(monkeypatch):
    captured = _Captured()
    monkeypatch.setattr(go_turns.aiohttp, "ClientSession", lambda **kw: _FakeSession(captured))
    c = TurnCollector()
    c.add_bot_text("so what I mean is", was_interrupted=True)
    _run(go_turns.post_turn_batch("conv-1", c.records()))
    assert captured.payload["turns"][0]["wasInterrupted"] is True


def test_http_failure_is_swallowed(monkeypatch):
    monkeypatch.setattr(
        go_turns.aiohttp,
        "ClientSession",
        lambda **kw: _FakeSession(_Captured(), status=500),
    )
    assert _run(go_turns.post_turn_batch("conv-1", _one_user_turn().records())) is False


def test_network_exception_is_swallowed(monkeypatch):
    def raising_session(**kw):
        raise RuntimeError("connection refused")

    monkeypatch.setattr(go_turns.aiohttp, "ClientSession", raising_session)
    assert _run(go_turns.post_turn_batch("conv-1", _one_user_turn().records())) is False


def test_empty_batch_is_not_posted(monkeypatch):
    def exploding_session(**kw):  # pragma: no cover
        raise AssertionError("must not post an empty batch")

    monkeypatch.setattr(go_turns.aiohttp, "ClientSession", exploding_session)
    assert _run(go_turns.post_turn_batch("conv-1", [])) is True
