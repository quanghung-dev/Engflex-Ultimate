"""Evidence-preserving PDF inventory, digital spans and region OCR."""

import importlib.metadata
import re
import time
from pathlib import Path

import pymupdf
from mutagen.mp3 import MP3

from pipeline_io import DATA, ROOT, VERSION, digest, file_hash, read, write


def inventory(test_number=None):
    root = ROOT / "Topic Test" / "Toeic 2024"
    files = []
    if test_number is not None:
        target_patterns = [
            re.compile(rf"^LC/TEST {test_number} LC_?\.pdf$", re.IGNORECASE),
            re.compile(rf"^RC/TEST {test_number} RC_?\.pdf$", re.IGNORECASE),
            re.compile(rf"^Audio/Test_{test_number:02d}\.mp3$", re.IGNORECASE),
            re.compile(r"^Answer/Answer\.pdf$", re.IGNORECASE),
            re.compile(r"^Answer/Answer LC ETS\.pdf$", re.IGNORECASE),
            re.compile(r"^Answer/Answer RC Test\.pdf$", re.IGNORECASE),
        ]
        candidate_paths = [
            p
            for p in root.rglob("*")
            if any(pat.match(p.relative_to(root).as_posix()) for pat in target_patterns)
        ]
    else:
        candidate_paths = [p for p in root.rglob("*") if p.suffix.lower() in (".pdf", ".mp3")]

    for path in sorted(candidate_paths):
        if path.suffix.lower() not in (".pdf", ".mp3"):
            continue
        entry = {"sourceId": path.relative_to(root).as_posix(), "sha256": file_hash(path)}
        if path.suffix.lower() == ".pdf":
            with pymupdf.open(path) as doc:
                entry["pages"] = [
                    {
                        "pageNumber": p.number + 1,
                        "width": p.rect.width,
                        "height": p.rect.height,
                        "rotation": p.rotation,
                        "textChars": len(p.get_text()),
                    }
                    for p in doc
                ]
        else:
            info = MP3(path).info
            entry.update(
                duration=info.length,
                sampleRate=info.sample_rate,
                channels=info.channels,
                bitrate=info.bitrate,
            )
        files.append(entry)
    result = {"collectionId": "toeic_2024", "files": files}
    if test_number is None:
        write(DATA / "inventory.json", result)
    return result


def source_path(source_id):
    root = (ROOT / "Topic Test" / "Toeic 2024").resolve()
    target = (root / source_id).resolve()
    if not target.is_relative_to(root):
        raise ValueError("Source path escapes source root")
    return target


def select_sources(manifest, number):
    selected = {}
    for section in ("LC", "RC"):
        hits = [
            f
            for f in manifest["files"]
            if re.fullmatch(rf"{section}/TEST {number} {section}_?\.pdf", f["sourceId"])
        ]
        if len(hits) != 1:
            raise ValueError(f"Expected one {section} file for test {number}, got {len(hits)}")
        selected[section] = hits[0]
    for role, name in (
        ("audio", f"Audio/Test_{number:02d}.mp3"),
        ("key", "Answer/Answer.pdf"),
        ("lcBook", "Answer/Answer LC ETS.pdf"),
        ("rcBook", "Answer/Answer RC Test.pdf"),
    ):
        selected[role] = next(f for f in manifest["files"] if f["sourceId"] == name)
    return selected


def digital(source):
    key = digest(
        {"source": source["sha256"], "version": VERSION, "pymupdf": importlib.metadata.version("pymupdf")}
    )
    dest = DATA / "cache" / f"digital_{key}.json"
    if dest.exists():
        return read(dest)
    pages = []
    with pymupdf.open(source_path(source["sourceId"])) as doc:
        for page in doc:
            spans = []
            for b in page.get_text("dict")["blocks"]:
                for line in b.get("lines", []):
                    for span in line["spans"]:
                        spans.append(
                            {
                                "text": span["text"],
                                "bbox": list(span["bbox"]),
                                "font": span["font"],
                                "flags": span["flags"],
                            }
                        )
            pages.append(
                {
                    "pageNumber": page.number + 1,
                    "width": page.rect.width,
                    "height": page.rect.height,
                    "spans": spans,
                    "text": page.get_text(),
                }
            )
    result = {"sourceId": source["sourceId"], "sourceHash": source["sha256"], "pages": pages}
    write(dest, result)
    return result


def ocr(source, output, scale=1.8, save_previews=False):
    import numpy as np
    from rapidocr_onnxruntime import RapidOCR

    config = {
        "source": source["sha256"],
        "scale": scale,
        "version": VERSION,
        "engine": importlib.metadata.version("rapidocr-onnxruntime"),
        "onnxruntime": importlib.metadata.version("onnxruntime"),
    }
    cache = DATA / "cache" / f"ocr_{digest(config)}"
    # Limit CPU threads: default oversubscribes laptop CPUs severely.
    engine = RapidOCR(intra_op_num_threads=4, inter_op_num_threads=1)
    pages = []
    with pymupdf.open(source_path(source["sourceId"])) as doc:
        for page in doc:
            dest = cache / f"page_{page.number + 1:03d}.json"
            preview_path = output / "pages" / f"{Path(source['sourceId']).stem}_{page.number + 1:03d}.png"
            preview_rel = None
            if save_previews:
                preview_path.parent.mkdir(parents=True, exist_ok=True)
                if not preview_path.exists():
                    page.get_pixmap(matrix=pymupdf.Matrix(1.4, 1.4)).save(preview_path)
                preview_rel = preview_path.relative_to(output).as_posix()
            elif preview_path.exists():
                preview_rel = preview_path.relative_to(output).as_posix()

            if dest.exists():
                pages.append(read(dest))
                continue
            start = time.monotonic()
            pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
            arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
            # Both columns are run separately so OCR never merges across a gutter.
            lines = []
            for col, (left, right) in enumerate(((0, pix.width // 2), (pix.width // 2, pix.width))):
                result, _ = engine(arr[:, left:right, :])
                for index, (quad, text, confidence) in enumerate(result or []):
                    xs = [(p[0] + left) / scale for p in quad]
                    ys = [p[1] / scale for p in quad]
                    lines.append(
                        {
                            "id": f"{Path(source['sourceId']).stem}:p{page.number + 1}:c{col}:{index}",
                            "text": text,
                            "confidence": float(confidence),
                            "column": col,
                            "bbox": [min(xs), min(ys), max(xs), max(ys)],
                        }
                    )
            result = {
                "sourceId": source["sourceId"],
                "pageNumber": page.number + 1,
                "width": page.rect.width,
                "height": page.rect.height,
                "rotation": page.rotation,
                "scale": scale,
                "seconds": time.monotonic() - start,
                "lines": lines,
                "preview": preview_rel,
            }
            write(dest, result)
            pages.append(result)
            print(
                f"OCR {source['sourceId']} page {page.number + 1}/{len(doc)}: {len(lines)} regions, {result['seconds']:.1f}s",
                flush=True,
            )
    return {"config": config, "pages": pages}


def answer_key(book, number):
    """Read labeled panels; digits and letters are separate PDF font spans."""
    found = []
    for page in book["pages"]:
        spans_all = page["spans"]
        labels = [s for s in spans_all if s["text"].strip() == "TEST"]
        for label in labels:
            digits = [
                s
                for s in spans_all
                if s["text"].strip() == str(number)
                and abs(s["bbox"][0] - label["bbox"][2]) < 3
                and abs(s["bbox"][1] - label["bbox"][1]) < 5
            ]
            if len(digits) != 1:
                continue
            col = int(label["bbox"][0] >= page["width"] / 2)
            left, right = col * page["width"] / 2, (col + 1) * page["width"] / 2
            bottom = min(
                [
                    s["bbox"][1]
                    for s in labels
                    if left <= s["bbox"][0] < right and s["bbox"][1] > label["bbox"][1] + 20
                ]
                or [page["height"]]
            )
            spans = [
                s
                for s in spans_all
                if left <= s["bbox"][0] < right and label["bbox"][3] < s["bbox"][1] < bottom
            ]
            for s in spans:
                if re.fullmatch(r"\s*\d{1,3}\s*", s["text"]) and 1 <= int(s["text"]) <= 100:
                    letters = [
                        a
                        for a in spans
                        if re.fullmatch("[ABCD]", a["text"])
                        and 0 < a["bbox"][0] - s["bbox"][2] < 15
                        and abs(a["bbox"][1] - s["bbox"][1]) < 2
                    ]
                    if len(letters) == 1:
                        a = letters[0]
                        found.append(
                            {
                                "questionNumber": int(s["text"]),
                                "key": a["text"],
                                "sourceRefs": [
                                    {
                                        "sourceId": book["sourceId"],
                                        "pageNumber": page["pageNumber"],
                                        "bbox": [
                                            s["bbox"][0],
                                            min(s["bbox"][1], a["bbox"][1]),
                                            a["bbox"][2],
                                            max(s["bbox"][3], a["bbox"][3]),
                                        ],
                                    }
                                ],
                            }
                        )
    return found
