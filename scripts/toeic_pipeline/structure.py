"""Conservative candidates: uncertain rows/layout stay in source evidence."""

import re

from pipeline_io import digest
from schemas import Block, Item, Option, Part, Passage, Question, Test

RANGES = [(1, 6), (7, 31), (32, 70), (71, 100), (101, 130), (131, 146), (147, 200)]


def ref(page, line):
    return {
        "sourceId": page["sourceId"],
        "pageNumber": page["pageNumber"],
        "bbox": line["bbox"],
        "blockId": line["id"],
    }


def question_candidates(pages, lower, upper):
    result = {}
    for page in pages:
        for col in (0, 1):
            current = None
            option = None
            for line in sorted(
                (x for x in page["lines"] if x["column"] == col), key=lambda x: (x["bbox"][1], x["bbox"][0])
            ):
                text = line["text"].strip()
                match = re.match(r"^(\d{1,3})[.．]?\s+(.+)", text)
                if match and lower <= int(match[1]) <= upper:
                    number = int(match[1])
                    candidate = {
                        "questionNumber": number,
                        "stem": match[2],
                        "options": [],
                        "sourceRefs": [ref(page, line)],
                    }
                    result.setdefault(number, []).append(candidate)
                    current, option = candidate, None
                    continue
                if current is None:
                    continue
                m = re.match(r"^\(?([ABCD])\)\s*(.*)", text)
                if m:
                    option = {"key": m[1], "text": m[2], "sourceRefs": [ref(page, line)]}
                    current["options"].append(option)
                elif text and not re.match(r"^(GO ON|TEST \d|PART \d|Questions?\b)", text, re.I):
                    if option:
                        option["text"] += " " + text
                        option["sourceRefs"].append(ref(page, line))
                    else:
                        current["stem"] += " " + text
                        current["sourceRefs"].append(ref(page, line))
    return result


def rc_answers(book, number):
    """Geometric same-baseline answers only; no guessing adjacent rows."""
    start = next(
        (i for i, p in enumerate(book["pages"]) if re.search(rf"(?:TEST|Test)\s*0?{number}\b", p["text"])),
        None,
    )
    if start is None:
        return [], None
    end = next(
        (
            i
            for i in range(start + 1, len(book["pages"]))
            if re.search(rf"(?:TEST|Test)\s*0?{number + 1}\b", book["pages"][i]["text"])
        ),
        len(book["pages"]),
    )
    answers = []
    for page in book["pages"][start:end]:
        spans = page["spans"]
        for s in spans:
            if re.fullmatch(r"\s*1\d\d\s*|\s*200\s*", s["text"]) and s["bbox"][0] < page["width"] * 0.2:
                hits = [
                    a
                    for a in spans
                    if re.fullmatch(r"\s*[ABCD]\s*", a["text"])
                    and 0 < a["bbox"][0] - s["bbox"][2] < 60
                    and abs(a["bbox"][1] - s["bbox"][1]) < 4
                ]
                if len(hits) == 1:
                    answers.append(
                        {
                            "questionNumber": int(s["text"]),
                            "key": hits[0]["text"].strip(),
                            "sourceRefs": [
                                {
                                    "sourceId": book["sourceId"],
                                    "pageNumber": page["pageNumber"],
                                    "bbox": hits[0]["bbox"],
                                }
                            ],
                        }
                    )
    return answers, {"startPage": start + 1, "endPage": end, "status": "needsReview"}


def build(number, sources, ocrs, keys):
    prefix = f"toeic_2024_test_{number:02d}"
    candidates = {}
    for section, bounds in (("LC", (32, 100)), ("RC", (101, 200))):
        candidates.update(question_candidates(ocrs[section]["pages"], *bounds))
    questions = {}
    for n in range(1, 201):
        values = candidates.get(n, [])
        candidate = values[0] if len(values) == 1 else {}
        answers = [a for a in keys if a["questionNumber"] == n]
        answer = answers[0] if len(answers) == 1 else {}
        questions[n] = Question(
            id=f"{prefix}_q{n:03d}",
            questionNumber=n,
            stem=candidate.get("stem"),
            options=[Option(**x) for x in candidate.get("options", [])]
            if n > 31
            else [Option(key=k, text=None) for k in ("ABC" if n >= 7 else "ABCD")],
            correctKey=answer.get("key"),
            answerRefs=answer.get("sourceRefs", []),
            sourceRefs=candidate.get("sourceRefs", []),
        )
    parts = []
    for index, (lo, hi) in enumerate(RANGES, 1):
        items = []
        if index in (1, 2, 5):
            groups = [[n] for n in range(lo, hi + 1)]
        elif index in (3, 4, 6):
            size = 4 if index == 6 else 3
            groups = [list(range(n, n + size)) for n in range(lo, hi + 1, size)]
        else:
            # Only observed question-range headings establish Part 7 groups.
            ranges = set()
            for page in ocrs["RC"]["pages"]:
                for line in page["lines"]:
                    m = re.search(r"Questions?\s*(\d{3})\s*[-–—~]\s*(\d{3})", line["text"], re.I)
                    if m and 147 <= int(m[1]) <= int(m[2]) <= 200:
                        ranges.add((int(m[1]), int(m[2])))
            groups = [list(range(a, b + 1)) for a, b in sorted(ranges)]
            covered = {n for g in groups for n in g}
            # Explicit unresolved groups ensure questions never disappear.
            groups.extend([[n] for n in range(lo, hi + 1) if n not in covered])
            groups.sort(key=lambda g: g[0])
        for ns in groups:
            item = Item(
                id=f"{prefix}_g{ns[0]:03d}_{ns[-1]:03d}",
                type="single" if index in (1, 2, 5) else "group",
                questions=[questions[n] for n in ns],
            )
            # Source-region evidence remains distinct from structured passages.
            if index in (6, 7):
                refs = {(r.sourceId, r.pageNumber) for n in ns for r in questions[n].sourceRefs}
                blocks = []
                for source_id, page_num in sorted(refs):
                    page = next(p for p in ocrs["RC"]["pages"] if p["pageNumber"] == page_num)
                    blocks.append(
                        Block(
                            id=f"{item.id}_source_p{page_num}",
                            type="sourceRegion",
                            sourceRefs=[
                                {
                                    "sourceId": source_id,
                                    "pageNumber": page_num,
                                    "bbox": [0.0, 0.0, page["width"], page["height"]],
                                }
                            ],
                        )
                    )
                if blocks:
                    item.passages = [Passage(id=f"{item.id}_unresolved", blocks=blocks)]
            items.append(item)
        parts.append(Part(partNumber=index, section="listening" if index <= 4 else "reading", items=items))
    return Test(
        testId=prefix,
        testNumber=number,
        title=f"TOEIC 2024 Test {number:02d}",
        sourceManifestHash=digest(sources),
        audioAssetId=sources["audio"]["sourceId"],
        assets=list(sources.values()),
        parts=parts,
    )
