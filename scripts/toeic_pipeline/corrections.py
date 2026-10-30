"""Explicit hash-bound replace operations; never silently rebase a correction."""

from copy import deepcopy

from pipeline_io import digest
from schemas import Test


def apply(payload, overlay):
    if overlay.get("payloadHash") != digest(payload):
        raise ValueError("Stale correction payload hash")
    result = deepcopy(payload)
    for change in overlay["changes"]:
        if change.get("op") != "replace" or not change.get("reason") or not change.get("reviewer"):
            raise ValueError("Corrections require replace, reviewer and reason")
        keys = [p.replace("~1", "/").replace("~0", "~") for p in change["path"].split("/")[1:]]
        if not keys:
            raise ValueError("Root replacement forbidden")
        node = result
        for key in keys[:-1]:
            node = node[int(key)] if isinstance(node, list) else node[key]
        key = int(keys[-1]) if isinstance(node, list) else keys[-1]
        if digest(node[key]) != change["expectedValueHash"]:
            raise ValueError("Correction target changed")
        node[key] = change["value"]
    return Test.model_validate(result)
