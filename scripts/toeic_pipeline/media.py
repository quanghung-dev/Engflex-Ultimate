"""Materialize source-bound crop candidates without overwriting original PDFs."""

import pymupdf

from extractors import source_path
from pipeline_io import BASE, file_hash, read
from schemas import Block


def crop_media(test, output):
    assets = []
    roi_file = BASE / "fixtures" / f"test_{test.testNumber:02d}_photo_regions.json"
    if roi_file.exists():
        rois = read(roi_file)
        if file_hash(source_path(rois["sourceId"])) != rois["sourceHash"]:
            raise ValueError("Photo region fixture source changed")
        for item in test.parts[0].items:
            n = item.questions[0].questionNumber
            region = next((r for r in rois["regions"] if r["questionNumber"] == n), None)
            if region:
                item.media = [
                    Block(
                        id=f"{item.id}_photo",
                        type="image",
                        sourceRefs=[
                            {
                                "sourceId": rois["sourceId"],
                                "pageNumber": region["pageNumber"],
                                "bbox": region["bbox"],
                            }
                        ],
                    )
                ]
    for part in test.parts:
        for item in part.items:
            blocks = list(item.media) + [
                b for p in item.passages for b in p.blocks if b.type in ("image", "table")
            ]
            for index, block in enumerate(blocks):
                if not block.sourceRefs:
                    continue
                ref = block.sourceRefs[0]
                if not ref.sourceId.endswith(".pdf") or not ref.bbox or not ref.pageNumber:
                    continue
                with pymupdf.open(source_path(ref.sourceId)) as doc:
                    page = doc[ref.pageNumber - 1]
                    box = pymupdf.Rect(ref.bbox)
                    if box.is_empty or not page.rect.contains(box):
                        continue
                    key = f"crops/{item.id}_{index}.png"
                    dest = output / key
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    page.get_pixmap(matrix=pymupdf.Matrix(3, 3), clip=box).save(dest)
                    block.assetId = key
                    assets.append({"sourceId": key, "sha256": file_hash(dest), "status": "needsReview"})
    test.assets.extend(assets)
    return assets
