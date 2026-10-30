from copy import deepcopy

import pytest

from content_export import project
from structure import build


def payload():
    sources = {
        k: {"sourceId": k, "sha256": "a", "duration": 2800.0}
        for k in ("LC", "RC", "audio", "key", "lcBook", "rcBook")
    }
    return build(2, sources, {"LC": {"pages": []}, "RC": {"pages": []}}, []).model_dump()


@pytest.mark.parametrize("location", ["root", "question", "option", "asset", "vocabulary"])
def test_projection_drops_new_metadata_by_default(location):
    data = payload()
    question = data["parts"][0]["items"][0]["questions"][0]
    targets = {
        "root": data,
        "question": question,
        "option": question["options"][0],
        "asset": data["assets"][2],
    }
    if location == "vocabulary":
        question["vocabulary"] = [{"raw": "source word", "debugNewField": "PRIVATE_METADATA"}]
    else:
        targets[location]["debugNewField"] = "PRIVATE_METADATA"
    result = project(data)
    assert "PRIVATE_METADATA" not in str(result)
    assert "sourceRefs" not in str(result)
    assert "answerRefs" not in str(result)
    assert [a["sourceId"] for a in result["assets"]] == ["audio"]


@pytest.mark.parametrize("field,value", [("stem", None), ("correctKey", "A"), ("targetIds", ["blank-131"])])
def test_projection_preserves_content_values_and_input(field, value):
    data = payload()
    data["parts"][0]["items"][0]["questions"][0][field] = value
    before = deepcopy(data)
    result = project(data)
    assert result["parts"][0]["items"][0]["questions"][0][field] == value
    assert data == before
    assert sum(len(i["questions"]) for p in result["parts"] for i in p["items"]) == 200


@pytest.mark.parametrize("fault", ["missing", "duplicate"])
def test_projection_rejects_invalid_asset_graph(fault):
    data = payload()
    audio = next(a for a in data["assets"] if a["sourceId"] == "audio")
    if fault == "missing":
        data["assets"].remove(audio)
    else:
        data["assets"].append(audio)
    with pytest.raises(ValueError):
        project(data)
