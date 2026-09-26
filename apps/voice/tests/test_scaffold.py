"""Scaffold smoke tests: config, RunnerBody DTO, no-DSN observability."""

import pytest
from pydantic import ValidationError

from config import settings
from observability import bind_session, get_metrics, init_sentry
from schemas import RunnerBody


def test_runner_body_round_trip():
    b = RunnerBody.model_validate({"userId": "u1", "conversationId": "c1", "maxDuration": 60})
    assert b.maxDuration == 60


def test_runner_body_defaults():
    b = RunnerBody.model_validate({"userId": "u1", "conversationId": "c1"})
    assert b.maxDuration == 300


@pytest.mark.parametrize("value", [30, 300, 3600])
def test_runner_body_bounds_accepted(value):
    b = RunnerBody.model_validate({"userId": "u", "conversationId": "c", "maxDuration": value})
    assert b.maxDuration == value


@pytest.mark.parametrize("value", [29, 3601])
def test_runner_body_bounds_rejected(value):
    with pytest.raises(ValidationError):
        RunnerBody.model_validate({"userId": "u", "conversationId": "c", "maxDuration": value})


def test_settings_defaults():
    assert settings.api_url == "http://localhost:8000"
    assert settings.llm_name == "gpt-4o-mini"
    assert settings.max_duration_sec == 300
    assert settings.idle_timeout_sec == 300


def test_observability_no_dsn():
    assert settings.sentry_dsn == ""
    init_sentry()  # must no-op without a DSN
    assert get_metrics() is None
    log = bind_session("u1", "c1")
    assert log is not None
