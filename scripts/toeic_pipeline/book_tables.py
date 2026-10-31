"""Extract RC solution table cells, retaining page-break continuation evidence."""

import re

import pymupdf

from extractors import source_path


def rc_solutions(source, start_page, end_page):
    result = {}
    current = None
    with pymupdf.open(source_path(source["sourceId"])) as doc:
        for page in list(doc)[start_page - 1 : end_page]:
            for table in page.find_tables().tables:
                for index, row in enumerate(table.extract()):
                    fields = [(c or "").strip() for c in row]
                    number = next((int(c) for c in fields[:6] if re.fullmatch(r"1\d\d|200", c)), None)
                    if number is not None:
                        current = number
                        result.setdefault(
                            number, {"explanation": [], "translation": [], "vocabulary": [], "sourceRefs": []}
                        )
                    elif not current or any(
                        "Giải thích" in c or "Phân tích" in c or "Câu" == c or "Đáp" == c for c in fields
                    ):
                        continue
                    elif any(fields[:2]):
                        continue
                    count = 3 if current <= 146 else 2
                    if len(fields) < count + 2:
                        continue
                    payload = fields[-count:]
                    record = result[current]
                    record["explanation"].append(payload[0])
                    if count == 3:
                        record["translation"].append(payload[1])
                    record["vocabulary"].append(payload[-1])
                    record["sourceRefs"].append(
                        {
                            "sourceId": source["sourceId"],
                            "pageNumber": page.number + 1,
                            "bbox": list(table.rows[index].bbox),
                        }
                    )
    return result


def enrich(test, solutions):
    for part in test.parts:
        for item in part.items:
            for q in item.questions:
                solution = solutions.get(q.questionNumber)
                if not solution:
                    continue
                q.explanation = "\n".join(t for t in solution["explanation"] if t) or q.explanation
                q.vietnameseText = "\n".join(t for t in solution["translation"] if t) or q.vietnameseText
                raw = "\n".join(t for t in solution["vocabulary"] if t)
                if raw:
                    q.vocabulary = [{"raw": raw}]
