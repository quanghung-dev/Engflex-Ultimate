"""Tests for the pronunciation assessment behind the analyze path.

Only the pure result mapping is tested here: the live scorer needs ~2.4 GB
of weights and seconds per call (see /tmp/opencode/probe_openpronounce.py),
so it stays out of the unit suite by design.
"""

from transcript.analyze.pronunciation import SpeechAssessment, to_speech_assessment


def _result(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "score": 91.11,
        "acoustic_distance": 5.565,
        "transcribe": "HELLO HOW ARE YOU",
        "language": "en",
        "differences": {
            "errors": [],
            "phoneme_error_rate": 0.2222,
            "word_error_rate": 0.0,
        },
        "prosody": {"f0": [120.0], "energy": [0.5]},
    }
    base.update(overrides)
    return base


def test_clean_reading_maps_to_an_empty_error_list():
    assessment = to_speech_assessment(_result())
    assert isinstance(assessment, SpeechAssessment)
    assert assessment.score == 91.11
    assert assessment.transcription == "HELLO HOW ARE YOU"
    assert assessment.errors == []
    assert assessment.phoneme_error_rate == 0.2222
    assert assessment.word_error_rate == 0.0
    assert assessment.acoustic_distance == 5.565


def test_mispronounced_words_keep_ipa_and_confidence():
    result = _result(
        score=4.44,
        differences={
            "errors": [
                {
                    "word": "hello",
                    "expected": "/həloʊ/",
                    "actual": "/hɛlnoʊ/",
                    "confidence": 0.89,
                },
                {
                    "word": "go",
                    "expected": "/ɡoʊ/",
                    "actual": None,
                    "confidence": 0.747,
                },
            ],
            "phoneme_error_rate": 0.8889,
            "word_error_rate": 1.0,
        },
    )
    assessment = to_speech_assessment(result)
    assert assessment.score == 4.44
    assert [e.word for e in assessment.errors] == ["hello", "go"]
    assert assessment.errors[0].expected == "/həloʊ/"
    assert assessment.errors[0].heard == "/hɛlnoʊ/"
    assert assessment.errors[0].confidence == 0.89
    # A missing word has no heard phones; it must not become "None" text.
    assert assessment.errors[1].heard == ""


def test_mapping_survives_a_bare_result():
    assessment = to_speech_assessment({})
    assert assessment.score == 0.0
    assert assessment.errors == []
    assert assessment.transcription == ""
