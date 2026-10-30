"""Targeted second OCR pass and source-bound repair of unresolved groups."""

import concurrent.futures
import copy

import numpy as np
import pymupdf
from rapidocr_onnxruntime import RapidOCR

from extractors import source_path
from llm import structure_part
from pipeline_io import DATA, digest, read, write


def repair(test, sources, ocrs, book_groups, keys):
    jobs = []
    for part in test.parts[5:]:
        for index, item in enumerate(part.items):
            unresolved = any(b.type == "sourceRegion" for p in item.passages for b in p.blocks)
            first = item.questions[0].questionNumber
            if part.partNumber == 7 and first >= 176 and len(item.passages) != (2 if first <= 185 else 3):
                unresolved = True
            blanks = [
                n.questionId for p in item.passages for b in p.blocks for n in b.inline if n.type == "blank"
            ]
            if part.partNumber == 6 and sorted(blanks) != sorted(q.id for q in item.questions):
                unresolved = True
            if unresolved:
                jobs.append((part, index, item))
    if not jobs:
        return
    source = sources["RC"]
    engine = RapidOCR(intra_op_num_threads=4, inter_op_num_threads=1)
    full_pages = {}
    needed = set()
    for _, _, item in jobs:
        for q in item.questions:
            needed.update(
                r.pageNumber for r in q.sourceRefs if r.sourceId == source["sourceId"] and r.pageNumber
            )
        for p in item.passages:
            for b in p.blocks:
                needed.update(
                    r.pageNumber for r in b.sourceRefs if r.sourceId == source["sourceId"] and r.pageNumber
                )
    with pymupdf.open(source_path(source["sourceId"])) as doc:
        for n in sorted(needed):
            key = digest({"source": source["sha256"], "page": n, "scale": 3, "engine": "full-page-v1"})
            dest = DATA / "cache" / f"full_ocr_{key}.json"
            if dest.exists():
                full_pages[n] = read(dest)
                continue
            page = doc[n - 1]
            pix = page.get_pixmap(matrix=pymupdf.Matrix(3, 3), alpha=False)
            arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
            result, _ = engine(arr)
            lines = []
            for i, (quad, text, score) in enumerate(result or []):
                xs = [p[0] / 3 for p in quad]
                ys = [p[1] / 3 for p in quad]
                lines.append(
                    {
                        "id": f"full:p{n}:{i}",
                        "text": text,
                        "bbox": [min(xs), min(ys), max(xs), max(ys)],
                        "confidence": float(score),
                        "column": 2,
                    }
                )
            artifact = {
                "sourceId": source["sourceId"],
                "pageNumber": n,
                "width": page.rect.width,
                "height": page.rect.height,
                "lines": lines,
            }
            write(dest, artifact)
            full_pages[n] = artifact
            print(f"Second OCR page {n}: {len(lines)} lines", flush=True)

    def execute(job):
        part, index, item = job
        nums = [q.questionNumber for q in item.questions]
        page_numbers = set(
            r.pageNumber
            for p in item.passages
            for b in p.blocks
            for r in b.sourceRefs
            if r.sourceId == source["sourceId"]
        )
        page_numbers.update(
            r.pageNumber
            for q in item.questions
            for r in q.sourceRefs
            if r.sourceId == source["sourceId"] and r.pageNumber
        )
        seed = copy.deepcopy(item.model_dump())
        seed["passages"] = []
        request = {
            "partNumber": part.partNumber,
            "section": part.section,
            "items": [seed],
            "repairInstructions": "Re-extract the COMPLETE passage from full-page OCR. The previous draft lost paragraph text or filled a blank. Preserve every blank and insertion marker as inline nodes. Never fill blank with correct answer. Do not copy missing fields from seed. Keep paragraphs as text; sourceRegion only if genuinely unreadable.",
        }
        result = structure_part(
            test.testNumber,
            part.partNumber,
            request,
            [full_pages[n] for n in sorted(page_numbers) if n in full_pages],
            book_groups.get(part.partNumber),
            [k for k in keys if k["questionNumber"] in nums],
        )
        if len(result.items) != 1:
            raise ValueError("Repair changed group identity")
        print(f"Repaired candidate {item.id}", flush=True)
        return part, index, result.items[0]

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for part, index, item in pool.map(execute, jobs):
            part.items[index] = item
