"""Read-only integration checks against the real Test 02 pilot artifacts."""

import pytest

from pipeline_io import read
from pipeline_io import test_dir as artifact_dir
from schemas import Test as ToeicTest

pytestmark = pytest.mark.skipif(
    not (artifact_dir(2) / "draft.json").exists(), reason="Run Test 02 pilot first"
)


@pytest.mark.parametrize(
    "number,expected",
    [(1, "A"), (2, "B"), (3, "C"), (4, "D"), (5, "C"), (6, "D"), (101, "C"), (102, "C"), (103, "A")],
)
def test_answers_match_manually_inspected_source_cells(number, expected):
    test = ToeicTest.model_validate(read(artifact_dir(2) / "draft.json"))
    questions = {q.questionNumber: q for p in test.parts for i in p.items for q in i.questions}
    assert questions[number].correctKey == expected


@pytest.mark.parametrize("part,expected", [(1, 6), (2, 25), (3, 39), (4, 30), (5, 30), (6, 16), (7, 54)])
def test_real_part_coverage(part, expected):
    test = ToeicTest.model_validate(read(artifact_dir(2) / "draft.json"))
    assert sum(len(i.questions) for i in test.parts[part - 1].items) == expected


@pytest.mark.parametrize("check", ["audio", "blank", "passages", "release"])
def test_real_integrity(check):
    test = ToeicTest.model_validate(read(artifact_dir(2) / "draft.json"))
    if check == "audio":
        items = [i for p in test.parts[:4] for i in p.items]
        assert len(items) == 54
        assert all(
            i.itemAudio and 0 <= i.itemAudio.startTime < i.itemAudio.endTime <= 2752.521 for i in items
        )
    elif check == "blank":
        for item in test.parts[5].items:
            blanks = [n for p in item.passages for b in p.blocks for n in b.inline if n.type == "blank"]
            assert sorted(n.questionId for n in blanks) == sorted(q.id for q in item.questions)
    elif check == "passages":
        for item in test.parts[6].items:
            first = item.questions[0].questionNumber
            if first >= 176:
                assert len(item.passages) == (2 if first <= 185 else 3)
    else:
        report = read(artifact_dir(2) / "validation.json")
        assert not report["releaseReady"]
        assert "reviewHash" in report["issueCounts"]
