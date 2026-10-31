from collections import Counter

from pipeline_io import digest
from schemas import Test
from structure import RANGES


def validate(test: Test, sources, reviews=None):
    issues = []

    def issue(code, target, detail):
        issues.append({"code": code, "target": target, "detail": detail, "status": "open"})

    source_by_id = {s["sourceId"]: s for s in sources.values()}

    def inspect_refs(value, target=""):
        if isinstance(value, dict):
            if "sourceId" in value and "pageNumber" in value:
                source = source_by_id.get(value["sourceId"])
                page = value.get("pageNumber")
                box = value.get("bbox")
                if source is None:
                    issue("invalidEvidence", target, "Unknown source")
                elif page is not None:
                    pages = source.get("pages", [])
                    if not 1 <= page <= len(pages):
                        issue("invalidEvidence", target, "Page outside source")
                    elif box and (
                        len(box) != 4
                        or not 0 <= box[0] < box[2] <= pages[page - 1]["width"]
                        or not 0 <= box[1] < box[3] <= pages[page - 1]["height"]
                    ):
                        issue("invalidEvidence", target, "Invalid source bounding box")
            for k, v in value.items():
                inspect_refs(v, target + "/" + k)
        elif isinstance(value, list):
            for i, v in enumerate(value):
                inspect_refs(v, target + f"/{i}")

    inspect_refs(test.model_dump())

    if test.sourceManifestHash != digest(sources):
        issue("staleManifest", "/", "Source identity changed")
    all_numbers = []
    ids = []
    previous_end = 0
    for part in test.parts:
        if not 1 <= part.partNumber <= 7:
            issue("partNumber", part.partNumber, "Invalid part")
            continue
        lo, hi = RANGES[part.partNumber - 1]
        numbers = []
        for item in part.items:
            ids.append(item.id)
            for question in item.questions:
                ids.append(question.id)
                n = question.questionNumber
                target = question.id
                numbers.append(n)
                keys = [o.key for o in question.options]
                if keys != list("ABC" if part.partNumber == 2 else "ABCD"):
                    issue("options", target, "Missing/duplicate/out-of-order options")
                if question.correctKey not in keys:
                    issue("answer", target, "Missing/invalid answer")
                if not question.answerRefs:
                    issue("answerEvidence", target, "No answer evidence")
                if part.partNumber <= 4:
                    issue(
                        "lcAnswerCrossCheck", target, "Independent LC book-answer comparison must be reviewed"
                    )
                if part.partNumber >= 3 and (
                    (not question.stem and part.partNumber != 6) or any(not o.text for o in question.options)
                ):
                    issue("content", target, "Missing stem/options")
                if part.partNumber >= 3 and not question.sourceRefs:
                    issue("sourceEvidence", target, "No printed source evidence")
                if not question.explanation:
                    issue(
                        "explanationReview",
                        target,
                        "Check whether explanation exists in source; null reason required",
                    )
            expected = {3: 3, 4: 3, 6: 4}.get(part.partNumber)
            if expected and len(item.questions) != expected:
                issue("groupSize", item.id, f"Expected {expected} questions")
            if part.partNumber <= 4:
                if not item.transcript:
                    issue("transcript", item.id, "Missing transcript")
                audio = item.itemAudio
                if audio is None:
                    issue("audio", item.id, "Missing complete item audio range")
                else:
                    if (
                        audio.assetId != test.audioAssetId
                        or not 0 <= audio.startTime < audio.endTime <= sources["audio"]["duration"]
                        or audio.startTime < previous_end
                    ):
                        issue("audioRange", item.id, "Wrong asset, overlap or invalid timeline")
                    previous_end = audio.endTime
                if item.stimulusAudio and (
                    audio is None
                    or not audio.startTime
                    <= item.stimulusAudio.startTime
                    < item.stimulusAudio.endTime
                    <= audio.endTime
                ):
                    issue("stimulusRange", item.id, "Stimulus not contained in item")
            if part.partNumber == 1 and not item.media:
                issue("image", item.id, "Missing photograph crop")
            if part.partNumber in (6, 7):
                first = item.questions[0].questionNumber
                if part.partNumber == 7 and first >= 176 and len(item.passages) != (2 if first <= 185 else 3):
                    issue(
                        "passageCount",
                        item.id,
                        "Expected double/triple passage group for this question range",
                    )
                inline_nodes = [node for p in item.passages for b in p.blocks for node in b.inline]
                if part.partNumber == 6:
                    for q in item.questions:
                        blanks = [
                            node for node in inline_nodes if node.type == "blank" and node.questionId == q.id
                        ]
                        if len(blanks) != 1 or q.targetIds != [blanks[0].id]:
                            issue("blankTarget", q.id, "Expected exactly one linked blank")
                if not item.passages or any(
                    b.type == "sourceRegion" for p in item.passages for b in p.blocks
                ):
                    issue("layout", item.id, "Passage layout unresolved")
                # Resolved references still need visual fidelity review.
                issue(
                    "targetReview", item.id, "Blank/insertion/marked-span structure needs manual verification"
                )
        if sorted(numbers) != list(range(lo, hi + 1)):
            issue("coverage", f"part{part.partNumber}", "Missing/duplicate/out-of-range questions")
        all_numbers += numbers
    if sorted(p.partNumber for p in test.parts) != list(range(1, 8)):
        issue("parts", "/parts", "Expected exactly seven parts")
    if sorted(all_numbers) != list(range(1, 201)):
        issue("coverage", "/", "Expected 200 unique questions")
    if len(ids) != len(set(ids)):
        issue("duplicateId", "/", "Duplicate content identity")
    # Automatic extraction never certifies original source identities or content.
    issue("sourceMappingReview", "/", "Test identity/page mappings require human confirmation")
    issue("contentReview", "/", "Full content/audio review and independent answer review required")
    if not reviews or reviews.get("payloadHash") != digest(test.model_dump()):
        issue("reviewHash", "/", "No review bound to current payload hash")
    else:
        decisions = reviews.get("decisions", [])
        for entry in issues:
            accepted = [
                d
                for d in decisions
                if d.get("code") == entry["code"]
                and d.get("target") == entry["target"]
                and d.get("decision") == "verified"
                and d.get("reviewer")
                and d.get("reason")
                and d.get("reviewedAt")
            ]
            # Structural defects cannot be waived by a review declaration.
            reviewable = {
                "sourceMappingReview",
                "contentReview",
                "explanationReview",
                "targetReview",
                "lcAnswerCrossCheck",
            }
            if entry["code"] in reviewable and len({d["reviewer"] for d in accepted}) >= 2:
                entry["status"] = "verified"
    open_issues = [i for i in issues if i["status"] == "open"]
    return {
        "payloadHash": digest(test.model_dump()),
        "questionCount": len(all_numbers),
        "answerCount": sum(
            q.correctKey is not None for p in test.parts for i in p.items for q in i.questions
        ),
        "transcriptItems": sum(bool(i.transcript) for p in test.parts for i in p.items),
        "issueCounts": dict(Counter(i["code"] for i in open_issues)),
        "issues": issues,
        "releaseReady": not open_issues,
    }
