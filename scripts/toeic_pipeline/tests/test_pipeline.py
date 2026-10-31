from copy import deepcopy

import pytest

from audio import align
from corrections import apply
from extractors import answer_key
from pipeline_io import digest
from schemas import Item, Question, TranscriptLine
from schemas import Test as ToeicTest
from structure import build
from validation import validate


def sources():
    return {
        k: {"sourceId": k, "sha256": "a", "duration": 2800.0}
        for k in ("LC", "RC", "audio", "key", "lcBook", "rcBook")
    }


@pytest.mark.parametrize("number,expected", [(1, "A"), (2, "C")])
def test_key_panels_ignore_text_order(number, expected):
    def span(text, x, y):
        return {"text": text, "bbox": [float(x), float(y), float(x + 10), float(y + 10)]}

    book = {
        "sourceId": "Answer/Answer.pdf",
        "pages": [
            {
                "pageNumber": 2,
                "width": 600.0,
                "height": 800.0,
                "spans": [
                    span("TEST", 350, 60),
                    span("2", 360, 60),
                    span("1", 320, 100),
                    span("C", 332, 100),
                    span("TEST", 50, 60),
                    span("1", 60, 60),
                    span("1", 20, 100),
                    span("A", 32, 100),
                ],
            }
        ],
    }
    result = answer_key(book, number)
    assert [(r["questionNumber"], r["key"]) for r in result] == [(1, expected)]


@pytest.mark.parametrize(
    "mutation,code",
    [("duplicate", "coverage"), ("wrongKey", "answer"), ("stale", "staleManifest"), ("nan", "schema")],
)
def test_validation_fails_closed(mutation, code):
    source = sources()
    test = build(2, source, {"LC": {"pages": []}, "RC": {"pages": []}}, [])
    if mutation == "duplicate":
        test.parts[0].items[1].questions[0].questionNumber = 1
    elif mutation == "wrongKey":
        test.parts[1].items[0].questions[0].correctKey = "D"
    elif mutation == "stale":
        source["audio"]["sha256"] = "changed"
    else:
        payload = test.model_dump()
        payload["parts"][0]["items"][0]["itemAudio"] = {
            "assetId": "audio",
            "startTime": float("nan"),
            "endTime": 1.0,
        }
        with pytest.raises(ValueError):
            ToeicTest.model_validate(payload)
        return
    report = validate(test, source)
    assert not report["releaseReady"]
    assert code in report["issueCounts"]


@pytest.mark.parametrize("fault", ["hash", "value", "reason"])
def test_correction_rejects_stale_or_unattributed(fault):
    payload = build(2, sources(), {"LC": {"pages": []}, "RC": {"pages": []}}, []).model_dump()
    overlay = {
        "payloadHash": digest(payload),
        "changes": [
            {
                "op": "replace",
                "path": "/title",
                "expectedValueHash": digest(payload["title"]),
                "value": "Corrected",
                "reviewer": "human",
                "reason": "source checked",
            }
        ],
    }
    if fault == "hash":
        overlay["payloadHash"] = "stale"
    if fault == "value":
        overlay["changes"][0]["expectedValueHash"] = "stale"
    if fault == "reason":
        overlay["changes"][0]["reason"] = ""
    before = deepcopy(payload)
    with pytest.raises(ValueError):
        apply(payload, overlay)
    assert payload == before


@pytest.mark.parametrize("review_hash", ["stale", None])
def test_review_cannot_waive_structural_errors(review_hash):
    source = sources()
    test = build(2, source, {"LC": {"pages": []}, "RC": {"pages": []}}, [])
    reviews = {
        "payloadHash": review_hash,
        "decisions": [
            {
                "code": "answer",
                "target": test.parts[0].items[0].questions[0].id,
                "decision": "verified",
                "reviewer": "a",
                "reason": "checked",
                "reviewedAt": "2026-10-30",
            }
        ],
    }
    result = validate(test, source, reviews)
    assert not result["releaseReady"]
    assert "answer" in result["issueCounts"]


@pytest.mark.parametrize("first,second,marker", [(1, 2, "Number"), (32, 35, "Questions")])
def test_audio_alignment_uses_narrator_anchors(first, second, marker):
    items = [
        Item(
            id=str(n),
            type="single",
            questions=[Question(id=f"q{n}", questionNumber=n)],
            transcript=[TranscriptLine(id=f"t{n}", role="utterance", text=text, sourceRefs=[])],
        )
        for n, text in [(first, "Hello good morning"), (second, "Welcome everyone")]
    ]
    segments = [
        {"start": 1.0, "end": 2.0, "text": f"{marker} {first}."},
        {"start": 3.0, "end": 4.0, "text": "Hello good morning"},
        {"start": 8.0, "end": 9.0, "text": f"{marker} {second}."},
        {"start": 10.0, "end": 11.0, "text": "Welcome everyone"},
    ]
    align(items, segments, "audio")
    assert items[0].itemAudio.startTime == 1.0
    assert items[0].itemAudio.endTime == 4.0
    assert items[1].itemAudio.startTime == 8.0
    assert items[0].stimulusAudio.endTime <= items[0].itemAudio.endTime
