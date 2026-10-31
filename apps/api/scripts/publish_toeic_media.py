"""Publish all hash-verified media for an existing TOEIC test (Part 1-7).

Reads the stored manifest without changing exam content, review status, answers
or attempts. Local source identities and HTTP(S) assets use the same MinIO keys
served through the web app's same-origin media route. Run from apps/api with uv.
"""

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import urlsplit
from urllib.request import urlopen


def media_assets(content):
    """Validate every graph reference and publish the entire asset manifest."""
    references = {content["audioAssetId"]}

    def visit(value):
        if isinstance(value, dict):
            for key, child in value.items():
                if key == "assetId" and isinstance(child, str):
                    references.add(child)
                else:
                    visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(content["parts"])
    assets = {asset["sourceId"]: asset for asset in content["assets"]}
    if len(assets) != len(content["assets"]):
        raise ValueError("Duplicate asset identity in manifest")
    missing = references - assets.keys()
    if missing:
        raise ValueError(f"Media references missing from manifest: {sorted(missing)}")
    return [assets[source] for source in sorted(assets)]


def local_asset(asset, source_root, crop_root):
    source = asset["sourceId"]
    digest = asset["sha256"].lower()
    if not re.fullmatch(r"[a-f0-9]{64}", digest):
        raise ValueError(f"Invalid SHA-256 for {source}")
    if urlsplit(source).scheme or source.startswith(("/", "\\")) or "\\" in source:
        raise ValueError(f"Expected a relative export asset identity: {source}")
    root = crop_root if source.startswith("crops/") else source_root
    if root is None:
        raise ValueError(f"Source root required for local asset: {source}")
    root = root.resolve()
    path = (root / source).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError(f"Asset missing or outside its source root: {source}")
    with path.open("rb") as stream:
        actual = hashlib.file_digest(stream, "sha256").hexdigest()
    if actual != digest:
        raise ValueError(f"Source bytes do not match stored SHA-256: {source}")
    return path, f"exams/toeic/{digest}"


def remote_asset(asset, download_root):
    source = asset["sourceId"]
    digest = asset["sha256"].lower()
    url = urlsplit(source)
    if not re.fullmatch(r"[a-f0-9]{64}", digest):
        raise ValueError(f"Invalid SHA-256 for {source}")
    if url.scheme not in ("http", "https") or not url.netloc:
        raise ValueError(f"Invalid media URL: {source}")
    path = download_root / digest
    with urlopen(source, timeout=30) as response, path.open("wb") as output:
        if urlsplit(response.geturl()).scheme not in ("http", "https"):
            raise ValueError(f"Invalid redirect for {source}")
        actual = hashlib.sha256()
        while chunk := response.read(1024 * 1024):
            actual.update(chunk)
            output.write(chunk)
    if actual.hexdigest() != digest:
        raise ValueError(f"Downloaded bytes do not match stored SHA-256: {source}")
    return path, f"exams/toeic/{digest}"


def prepare(content, source_root, crop_root, download_root):
    # Validate every source before performing the first upload.
    from mutagen.mp3 import MP3
    from PIL import Image

    prepared = []
    duration = None
    for asset in media_assets(content):
        source = asset["sourceId"]
        if urlsplit(source).scheme in ("http", "https"):
            path, key = remote_asset(asset, download_root)
        else:
            path, key = local_asset(asset, source_root, crop_root)
        if source == content["audioAssetId"]:
            duration = MP3(path).info.length
            if not math.isfinite(duration) or duration <= 0:
                raise ValueError("Invalid MP3 duration")
            content_type = "audio/mpeg"
        else:
            with Image.open(path) as image:
                content_type = Image.MIME.get(image.format)
                image.verify()
            if content_type is None:
                raise ValueError(f"Unsupported image format: {source}")
        prepared.append((asset, path, key, content_type))
    for part in content["parts"]:
        for item in part["items"]:
            for field in ("itemAudio", "stimulusAudio"):
                audio = item.get(field)
                if audio and not (0 <= audio["startTime"] < audio["endTime"] <= duration):
                    raise ValueError(f"Audio range outside source duration: {item['id']}")
    return prepared


def publish_content(content, source_root=None, crop_root=None, dry_run=False):
    from dotenv import load_dotenv

    load_dotenv()
    with tempfile.TemporaryDirectory() as directory:
        prepared = prepare(content, source_root, crop_root, Path(directory))
        summary = {"validatedAssets": len(prepared), "bytes": sum(path.stat().st_size for _, path, _, _ in prepared)}
        if dry_run:
            return summary
        from minio import Minio

        endpoint = urlsplit(os.environ.get("MINIO_ENDPOINT") or "http://localhost:9000")
        if endpoint.scheme not in ("http", "https") or not endpoint.netloc:
            raise ValueError("MINIO_ENDPOINT must be an HTTP(S) URL")
        client = Minio(endpoint.netloc, access_key=os.environ["MINIO_ROOT_USER"], secret_key=os.environ["MINIO_ROOT_PASSWORD"], secure=endpoint.scheme == "https")
        bucket = os.environ.get("MINIO_BUCKET") or "lesson-audio"
        if not client.bucket_exists(bucket):
            raise ValueError("Media bucket missing; run docker compose run --rm minio-init first")
        for asset, path, key, content_type in prepared:
            client.fput_object(bucket, key, str(path), content_type=content_type)
            response = client.get_object(bucket, key)
            try:
                digest = hashlib.sha256()
                for chunk in response.stream(1024 * 1024):
                    digest.update(chunk)
                if digest.hexdigest() != asset["sha256"].lower():
                    raise ValueError(f"Published media hash mismatch: {asset['sourceId']}")
            finally:
                response.close()
                response.release_conn()
            print(f"Verified {asset['sourceId']} -> {key}")
        return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test-id", required=True)
    parser.add_argument("--source-root", type=Path, help="Required for relative non-crop assets")
    parser.add_argument("--crop-root", type=Path, help="Required for relative crop assets")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    from dotenv import load_dotenv
    import psycopg

    load_dotenv()
    with psycopg.connect(os.environ["DATABASE_URL"]) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT content FROM exam_tests WHERE id = %s", (args.test_id,))
            row = cursor.fetchone()
    if row is None:
        raise SystemExit("Exam test not found")
    summary = publish_content(row[0], args.source_root, args.crop_root, args.dry_run)
    print(json.dumps(summary))
    if not args.dry_run:
        print("Published all TOEIC media; exam content and attempts unchanged")


if __name__ == "__main__":
    main()
