"""Seed stories from StoryWeaver source JSON into PostgreSQL with edge-tts audio and DeepSeek translation.

Pipeline:
1. Reads source stories from apps/api/data/stories/source_stories.json.
2. Checks DB: skips existing stories by slug (idempotent).
3. Translates title and sentences into Vietnamese via DeepSeek (DeepSeek-V4.1-Flash-1017).
4. Generates speech with edge-tts, records exact sentence start/end timestamps,
   joins MP3 frames and saves locally to apps/api/data/stories/audio/{slug}.mp3.
5. Inserts into `stories` and `story_sentences` tables.

Usage:
  uv run --with edge-tts --with "psycopg[binary]" --with python-dotenv --with requests python scripts/seed_stories.py
  Add --dry-run to validate configs, translation, and timestamps without writing to DB or disk.
"""

import argparse
import asyncio
import io
import json
import os
import sys
import uuid
from pathlib import Path

import edge_tts
from dotenv import load_dotenv


def load_env() -> None:
    # Load apps/api/.env
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def db_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("Error: DATABASE_URL is not set (apps/api/.env or environment)")
    return url


def check_deepseek_config() -> tuple[str, str, str]:
    api_key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        print("\n" + "=" * 70, file=sys.stderr)
        print("❌ [ERROR] DEEPSEEK_API_KEY is not set or empty in apps/api/.env!", file=sys.stderr)
        print("Please set your DeepSeek API key in apps/api/.env to enable translation:", file=sys.stderr)
        print("    DEEPSEEK_API_KEY=your_key_here", file=sys.stderr)
        print("    DEEPSEEK_BASE_URL=https://api.deepseek.com", file=sys.stderr)
        print("    DEEPSEEK_MODEL=DeepSeek-V4.1-Flash-1017", file=sys.stderr)
        print("=" * 70 + "\n", file=sys.stderr)
        sys.exit(1)

    base_url = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com").rstrip("/")
    model = os.environ.get("DEEPSEEK_MODEL", "DeepSeek-V4.1-Flash-1017")
    return api_key, base_url, model


def translate_with_deepseek(
    title: str,
    sentences: list[str],
    api_key: str,
    base_url: str,
    model: str,
) -> tuple[str, list[str]]:
    """Translate title and all sentences in a single prompt using DeepSeek."""
    import requests

    endpoint = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    system_prompt = (
        "You are a professional literary translator specializing in English-to-Vietnamese children's stories. "
        "Translate the story title and each sentence into natural, expressive Vietnamese suitable for English learners. "
        "Return ONLY a valid JSON object with the format: "
        '{"title_vietnamese": "...", "translations": ["sentence 1 translation", "sentence 2 translation", ...]} '
        "without markdown code blocks, backticks, or any extraneous text."
    )

    user_payload = {
        "title": title,
        "sentences": sentences,
    }

    # Map user-configured model to provider's API ID (e.g. DeepSeek-V4.1-Flash-1017 -> deepseek-flash)
    MODEL_ALIASES = {
        "deepseek-v4.1-flash-1017": "deepseek-flash",
        "deepseek-v4.1-flash": "deepseek-flash",
    }
    request_model = MODEL_ALIASES.get(model.lower(), model)

    body = {
        "model": request_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.3,
    }

    resp = requests.post(endpoint, headers=headers, json=body, timeout=60)
    if resp.status_code != 200:
        raise RuntimeError(f"DeepSeek API error {resp.status_code}: {resp.text}")

    resp_json = resp.json()
    content = resp_json["choices"][0]["message"]["content"]
    parsed = json.loads(content)

    title_vi = parsed.get("title_vietnamese", "").strip()
    translations = parsed.get("translations", [])

    if len(translations) != len(sentences):
        print(f"⚠️ Warning: DeepSeek returned {len(translations)} translations for {len(sentences)} sentences.")
        while len(translations) < len(sentences):
            translations.append("")

    return title_vi, translations


async def synthesize_story_audio(
    sentences: list[str],
    voice: str,
) -> tuple[bytes, list[dict]]:
    """Synthesize each sentence, record start/end timestamps, and join MP3 frames."""
    all_audio_frames: list[bytes] = []
    sentence_records: list[dict] = []
    current_time = 0.0

    for i, text in enumerate(sentences):
        comm = edge_tts.Communicate(text, voice)
        audio_stream = io.BytesIO()
        dur = 0.0

        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
            elif chunk["type"] == "SentenceBoundary":
                chunk_end = (chunk["offset"] + chunk["duration"]) / 10_000_000.0
                dur = max(dur, chunk_end)

        chunk_bytes = audio_stream.getvalue()
        if not chunk_bytes:
            raise ValueError(f"edge-tts produced no audio for sentence {i + 1}: {text!r}")

        # If SentenceBoundary was missing or 0, fallback estimate ~150 words/min
        if dur <= 0:
            word_count = max(1, len(text.split()))
            dur = (word_count / 150.0) * 60.0

        start_ts = round(current_time, 2)
        end_ts = round(current_time + dur, 2)

        sentence_records.append({
            "sequence": i + 1,
            "english_text": text,
            "start_timestamp": start_ts,
            "end_timestamp": end_ts,
        })

        all_audio_frames.append(chunk_bytes)
        current_time = end_ts

    joined_mp3 = b"".join(all_audio_frames)
    return joined_mp3, sentence_records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed stories into PostgreSQL with edge-tts and DeepSeek.")
    parser.add_argument(
        "--file",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "stories" / "source_stories.json",
        help="Path to source stories JSON file",
    )
    parser.add_argument(
        "--audio-dir",
        type=Path,
        default=Path(__file__).resolve().parents[3] / "apps" / "web" / "public" / "audio" / "stories",
        help="Directory to save generated MP3 files for web consumption",
    )
    parser.add_argument(
        "--backup-audio-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "stories" / "audio",
        help="Local backend backup directory to save generated MP3 files",
    )
    parser.add_argument(
        "--voice",
        type=str,
        default="en-US-AriaNeural",
        help="edge-tts voice (default: en-US-AriaNeural)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate run without writing to disk or database",
    )
    return parser.parse_args()


# Map StoryWeaver level to CEFR
LEVEL_MAP = {
    "1": "A1",
    "2": "A2",
    "3": "B1",
    "4": "B2",
    "A1": "A1",
    "A2": "A2",
    "B1": "B1",
    "B2": "B2",
    "C1": "C1",
    "C2": "C2",
}


async def main() -> None:
    # Ensure UTF-8 output on Windows terminal
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    args = parse_args()
    load_env()

    if not args.file.exists():
        sys.exit(f"Source file not found: {args.file}")

    with open(args.file, "r", encoding="utf-8") as f:
        stories_data = json.load(f)

    if not stories_data:
        sys.exit("Source file contains no stories.")

    print(f"📖 Loaded {len(stories_data)} stories from {args.file.name}")
    print(f"🎙️  Using edge-tts voice: {args.voice}")

    # Check DeepSeek API configuration (fail-fast if key is missing)
    if not args.dry_run:
        api_key, base_url, model = check_deepseek_config()
        print(f"🤖 Translation engine: {model} ({base_url})")
    else:
        print("🔍 DRY RUN mode enabled — skipping external writes.")
        api_key = os.environ.get("DEEPSEEK_API_KEY", "")
        base_url = os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        model = os.environ.get("DEEPSEEK_MODEL", "DeepSeek-V4.1-Flash-1017")

    import psycopg

    conn = psycopg.connect(db_url()) if not args.dry_run else None

    # Ensure audio output directory exists
    if not args.dry_run:
        args.audio_dir.mkdir(parents=True, exist_ok=True)
        args.backup_audio_dir.mkdir(parents=True, exist_ok=True)

    imported_count = 0
    skipped_count = 0

    try:
        for idx, item in enumerate(stories_data, start=1):
            slug = item.get("slug", "").strip()
            title = item.get("title", "").strip()
            raw_level = str(item.get("level", "1")).strip()
            cefr_level = LEVEL_MAP.get(raw_level, "A1")
            topic = item.get("topic", "Pratham Books").strip()
            thumbnail_url = item.get("thumbnail_url", "").strip() or None
            raw_sentences = item.get("sentences", [])

            if not slug or not title or not raw_sentences:
                print(f"⚠️  [SKIP] Story #{idx} missing required fields (slug, title, or sentences).")
                continue

            # Parse sentences (supports both plain string "..." and object {"text": "...", "image_url": "..."})
            sentence_items = []
            for s_entry in raw_sentences:
                if isinstance(s_entry, str):
                    sentence_items.append({"text": s_entry.strip(), "image_url": None})
                elif isinstance(s_entry, dict):
                    img_val = s_entry.get("image_url")
                    clean_img = str(img_val).strip() if img_val is not None else None
                    if clean_img in ("", "None", "null"):
                        clean_img = None
                    sentence_items.append({
                        "text": str(s_entry.get("text", "")).strip(),
                        "image_url": clean_img,
                    })
            plain_sentences = [si["text"] for si in sentence_items]

            print(f"\n[{idx}/{len(stories_data)}] Processing '{title}' (slug: {slug}, Level {raw_level} -> {cefr_level}, {len(plain_sentences)} sentences)...")

            # Check if story already exists in DB
            if conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1 FROM stories WHERE slug = %s", (slug,))
                    if cur.fetchone():
                        print(f"   ⏩ [SKIP] Story '{slug}' already exists in database.")
                        skipped_count += 1
                        continue

            # 1. Translate with DeepSeek
            print(f"   🌐 [1/3] Translating via DeepSeek ({model})...")
            if not args.dry_run:
                title_vi, translations = translate_with_deepseek(
                    title=title,
                    sentences=plain_sentences,
                    api_key=api_key,
                    base_url=base_url,
                    model=model,
                )
            else:
                title_vi = f"[VI] {title}"
                translations = [f"[VI] {s}" for s in plain_sentences]
            print(f"      -> Title (VI): {title_vi}")

            # 2. Synthesize audio with edge-tts
            print(f"   🔊 [2/3] Synthesizing speech & calculating sentence timestamps...")
            mp3_bytes, sentence_records = await synthesize_story_audio(plain_sentences, args.voice)

            total_duration = sentence_records[-1]["end_timestamp"] if sentence_records else 0.0
            print(f"      -> Generated {len(sentence_records)} sentence markers, duration: {total_duration:.1f}s")

            # Attach Vietnamese translations and illustration image URLs to sentence records
            for i, rec in enumerate(sentence_records):
                rec["vietnamese_text"] = translations[i] if i < len(translations) else ""
                rec["image_url"] = sentence_items[i]["image_url"] if i < len(sentence_items) else None

            # Save MP3 to web public directory and backup directory
            audio_filename = f"{slug}.mp3"
            web_audio_path = args.audio_dir / audio_filename
            backup_audio_path = args.backup_audio_dir / audio_filename
            audio_url = f"/audio/stories/{audio_filename}"

            if not args.dry_run:
                with open(web_audio_path, "wb") as f_web:
                    f_web.write(mp3_bytes)
                with open(backup_audio_path, "wb") as f_backup:
                    f_backup.write(mp3_bytes)
                print(f"      -> Saved MP3: {web_audio_path} ({len(mp3_bytes)} bytes)")

            # 3. Insert into Database
            if conn:
                print(f"   💾 [3/3] Inserting into PostgreSQL...")
                story_id = str(uuid.uuid4())

                with conn.transaction():
                    with conn.cursor() as cur:
                        # Insert story
                        cur.execute(
                            """
                            INSERT INTO stories (
                                id, slug, title, title_vietnamese, cefr_level,
                                topic, thumbnail_url, audio_url, duration,
                                created_at, updated_at
                            ) VALUES (
                                %s, %s, %s, %s, %s,
                                %s, %s, %s, %s,
                                NOW(), NOW()
                            )
                            """,
                            (
                                story_id,
                                slug,
                                title,
                                title_vi,
                                cefr_level,
                                topic,
                                thumbnail_url,
                                audio_url,
                                total_duration,
                            ),
                        )

                        # Insert sentences
                        for s in sentence_records:
                            cur.execute(
                                """
                                INSERT INTO story_sentences (
                                    id, story_id, sequence, english_text,
                                    vietnamese_text, image_url, start_timestamp, end_timestamp,
                                    created_at, updated_at
                                ) VALUES (
                                    %s, %s, %s, %s,
                                    %s, %s, %s, %s,
                                    NOW(), NOW()
                                )
                                """,
                                (
                                    str(uuid.uuid4()),
                                    story_id,
                                    s["sequence"],
                                    s["english_text"],
                                    s["vietnamese_text"],
                                    s["image_url"],
                                    s["start_timestamp"],
                                    s["end_timestamp"],
                                ),
                            )

                print(f"      ✅ Inserted story '{slug}' with {len(sentence_records)} sentences.")
                conn.commit()
                imported_count += 1
            else:
                print(f"      [DRY-RUN] Would insert story '{slug}' with {len(sentence_records)} sentences.")
                imported_count += 1

    finally:
        if conn:
            conn.close()

    print("\n" + "=" * 50)
    print(f"🎉 Completed! Imported: {imported_count}, Skipped: {skipped_count}")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
