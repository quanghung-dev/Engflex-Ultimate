"""StoryWeaver Crawler & End-to-End Ingestion Tool.

Crawls storybook pages, text, and high-resolution illustration crops directly
from Pratham Books StoryWeaver (https://storyweaver.org.in).

Supports two modes:
1. Extract & Save to JSON:
   Saves story metadata, sentences, and scene illustration URLs to source_stories.json.
2. End-to-End Ingestion (--ingest):
   Crawls StoryWeaver -> Translates via DeepSeek -> Generates edge-tts speech & timestamps ->
   Saves MP3 to apps/web/public/audio/stories -> Inserts into PostgreSQL stories & story_sentences.

Usage:
  # 1. Crawl and append to source_stories.json
  uv run --with requests --with python-dotenv python scripts/crawl_storyweaver.py --url https://storyweaver.org.in/stories/16411-too-big-too-small

  # 2. Crawl and ingest directly into Database with audio and Vietnamese translation
  uv run --with requests --with python-dotenv --with edge-tts --with "psycopg[binary]" python scripts/crawl_storyweaver.py --url https://storyweaver.org.in/stories/16411-too-big-too-small --ingest
"""

import argparse
import asyncio
import html
import json
import os
import re
import sys
import uuid
from pathlib import Path
from typing import Any, Optional

import requests
from dotenv import load_dotenv

# Ensure scripts dir is in sys.path for importing seed_stories helpers
scripts_dir = Path(__file__).resolve().parent
if str(scripts_dir) not in sys.path:
    sys.path.insert(0, str(scripts_dir))


STORYWEAVER_BASE = "https://storyweaver.org.in"
NODE_API_BASE = f"{STORYWEAVER_BASE}/node/api/v1"
API_V1_BASE = f"{STORYWEAVER_BASE}/api/v1"

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


def load_env() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def create_session() -> requests.Session:
    """Create a configured requests session and initialize StoryWeaver session cookies."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "locale": "en",
    })
    try:
        session.get(f"{NODE_API_BASE}/init-session", timeout=10)
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize StoryWeaver session: {e}", file=sys.stderr)
    return session


def extract_story_id(input_str: str, session: requests.Session) -> tuple[int, str]:
    """Resolve input URL, slug, or search query to a numerical Story ID and slug."""
    input_str = input_str.strip()

    # If it's a full URL e.g. https://storyweaver.org.in/stories/16411-too-big-too-small
    match_url = re.search(r"/stories/(\d+)(?:-([^/?#]+))?", input_str)
    if match_url:
        story_id = int(match_url.group(1))
        slug = match_url.group(2) or str(story_id)
        return story_id, slug

    # If it's a slug like 16411-too-big-too-small
    match_slug = re.match(r"^(\d+)-(.+)$", input_str)
    if match_slug:
        return int(match_slug.group(1)), match_slug.group(2)

    # If it's purely digits e.g. 16411
    if input_str.isdigit():
        return int(input_str), f"story-{input_str}"

    # Otherwise, search by query
    print(f"🔍 Searching StoryWeaver for: '{input_str}'...")
    search_url = f"{API_V1_BASE}/books-search"
    resp = session.get(search_url, params={"query": input_str}, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    books = data.get("data", [])
    if not books:
        sys.exit(f"❌ No stories found on StoryWeaver matching '{input_str}'")

    first_book = books[0]
    story_id = first_book["id"]
    raw_slug = first_book.get("slug", "")
    # Clean slug (strip leading ID if present)
    clean_slug = re.sub(r"^\d+-", "", raw_slug) or f"story-{story_id}"
    print(f"   -> Found: '{first_book.get('title')}' (ID: {story_id}, Slug: {clean_slug})")
    return int(story_id), clean_slug


def clean_html_text(raw_html: str) -> str:
    """Strip HTML tags, decode entities, and normalize whitespace."""
    if not raw_html:
        return ""
    # Replace breaks/paragraphs with spaces
    text = re.sub(r"<(?:p|br|div)[^>]*>", " ", raw_html, flags=re.IGNORECASE)
    # Strip remaining tags
    text = re.sub(r"<[^>]+>", "", text)
    # Decode HTML entities (&nbsp;, &quot;, &#39;, etc.)
    text = html.unescape(text)
    # Normalize spaces
    text = " ".join(text.split()).strip()
    return text


def fetch_illustration_url(crop_id: int, session: requests.Session) -> Optional[str]:
    """Fetch high-resolution image URL for a given illustration crop ID."""
    url = f"{NODE_API_BASE}/illustrations/{crop_id}"
    try:
        resp = session.get(url, timeout=10)
        if resp.status_code != 200:
            return None
        data = resp.json().get("data", {})
        image_urls = data.get("imageUrls", [])
        if not image_urls:
            return None
        sizes = image_urls[0].get("sizes", [])
        if not sizes:
            return None
        # First size is typically the largest / highest quality
        return sizes[0].get("url")
    except Exception as e:
        print(f"⚠️ Failed to fetch illustration crop {crop_id}: {e}", file=sys.stderr)
        return None


def crawl_story(input_val: str, session: requests.Session) -> dict[str, Any]:
    """Crawl a complete storybook with metadata, text, and scene illustrations."""
    story_id, initial_slug = extract_story_id(input_val, session)

    print(f"📥 [1/3] Fetching story metadata for ID: {story_id}...")
    meta_url = f"{NODE_API_BASE}/stories/{story_id}"
    meta_resp = session.get(meta_url, timeout=15)
    meta_resp.raise_for_status()
    meta_data = meta_resp.json().get("data", {})

    title = meta_data.get("name") or meta_data.get("title") or "Untitled Story"
    level = str(meta_data.get("level", "1")).strip()
    publisher = meta_data.get("publisher", {}).get("name") or "Pratham Books"

    # Cover thumbnail
    thumbnail_url = None
    cover_image = meta_data.get("coverImage", {})
    if "sizes" in cover_image and cover_image["sizes"]:
        # sizes can be dict of size1..size7 or list
        sizes = cover_image["sizes"]
        if isinstance(sizes, dict):
            thumbnail_url = sizes.get("size5") or sizes.get("size6") or next(iter(sizes.values()), None)
        elif isinstance(sizes, list) and sizes:
            thumbnail_url = sizes[0].get("url")

    slug = meta_data.get("slug") or initial_slug
    clean_slug = re.sub(r"^\d+-", "", slug)

    print(f"   -> Title: '{title}', Level: {level}, Topic: '{publisher}'")

    print(f"📄 [2/3] Fetching story pages from StoryWeaver...")
    pages_url = f"{NODE_API_BASE}/story_pages/{story_id}"
    pages_resp = session.get(pages_url, timeout=15)
    pages_resp.raise_for_status()
    pages_data = pages_resp.json().get("data", {}).get("pages", [])

    print(f"   -> Retrieved {len(pages_data)} raw pages.")

    print(f"🎨 [3/3] Extracting text and resolving scene illustrations...")
    sentences = []
    crop_cache: dict[int, Optional[str]] = {}

    for page in sorted(pages_data, key=lambda p: p.get("position", 0)):
        raw_content = page.get("content") or ""
        clean_text = clean_html_text(raw_content)

        # Skip empty title/cover pages that have no story text
        if not clean_text:
            continue

        crop_id = page.get("illustration_crop_id")
        image_url = None

        if crop_id:
            if crop_id not in crop_cache:
                print(f"      🖼️ Resolving illustration crop #{crop_id}...")
                crop_cache[crop_id] = fetch_illustration_url(crop_id, session)
            image_url = crop_cache[crop_id]

        # In case a page contains multiple sentences, or is a single sentence:
        # We preserve the page text chunk mapped to its illustration.
        sentences.append({
            "text": clean_text,
            "image_url": image_url,
        })

    if not sentences:
        sys.exit(f"❌ Error: No readable text found in story {story_id}.")

    # Fallback thumbnail from first illustration if coverImage sizes was missing
    if not thumbnail_url and sentences and sentences[0]["image_url"]:
        thumbnail_url = sentences[0]["image_url"]

    story_obj = {
        "slug": clean_slug,
        "title": title,
        "level": level,
        "topic": publisher,
        "thumbnail_url": thumbnail_url,
        "sentences": sentences,
    }

    print(f"✨ Successfully crawled '{title}' with {len(sentences)} sentence scenes!")
    return story_obj


def save_to_source_stories(story_obj: dict[str, Any], filepath: Path) -> None:
    """Save or update the story inside source_stories.json without duplicates."""
    stories = []
    if filepath.exists():
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                stories = json.load(f)
        except Exception:
            stories = []

    # Check if slug already exists
    slug = story_obj["slug"]
    existing_idx = next((i for i, s in enumerate(stories) if s.get("slug") == slug), None)

    if existing_idx is not None:
        print(f"🔄 Updating existing story '{slug}' in {filepath.name}...")
        stories[existing_idx] = story_obj
    else:
        print(f"➕ Appending story '{slug}' to {filepath.name}...")
        stories.append(story_obj)

    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(stories, f, indent=2, ensure_ascii=False)

    print(f"💾 Saved to {filepath} (Total stories: {len(stories)})")


async def ingest_crawled_story(
    story_obj: dict[str, Any],
    voice: str,
    dry_run: bool = False,
) -> None:
    """Run end-to-end ingestion: DeepSeek translation, edge-tts audio, and PostgreSQL insert."""
    from seed_stories import (
        check_deepseek_config,
        db_url,
        synthesize_story_audio,
        translate_with_deepseek,
    )

    slug = story_obj["slug"]
    title = story_obj["title"]
    raw_level = story_obj.get("level", "1")
    cefr_level = LEVEL_MAP.get(str(raw_level), "A1")
    topic = story_obj.get("topic", "Pratham Books")
    thumbnail_url = story_obj.get("thumbnail_url")
    sentence_items = story_obj.get("sentences", [])
    plain_sentences = [s["text"] for s in sentence_items]

    print(f"\n🚀 [INGEST] Running end-to-end pipeline for '{title}' (slug: {slug}, CEFR: {cefr_level})...")

    if not dry_run:
        api_key, base_url, model = check_deepseek_config()
    else:
        api_key, base_url, model = "", "https://api.deepseek.com", "DeepSeek-V4.1-Flash-1017"

    # 1. Translate with DeepSeek
    print(f"   🌐 [1/3] Translating title & {len(plain_sentences)} sentences via DeepSeek ({model})...")
    if not dry_run:
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
    print(f"   🔊 [2/3] Synthesizing speech with edge-tts ({voice})...")
    mp3_bytes, sentence_records = await synthesize_story_audio(plain_sentences, voice)
    total_duration = sentence_records[-1]["end_timestamp"] if sentence_records else 0.0
    print(f"      -> Duration: {total_duration:.1f}s across {len(sentence_records)} sentences.")

    # Attach translations & images
    for i, rec in enumerate(sentence_records):
        rec["vietnamese_text"] = translations[i] if i < len(translations) else ""
        rec["image_url"] = sentence_items[i]["image_url"] if i < len(sentence_items) else None

    # Paths
    audio_filename = f"{slug}.mp3"
    web_audio_dir = Path(__file__).resolve().parents[3] / "apps" / "web" / "public" / "audio" / "stories"
    backup_audio_dir = Path(__file__).resolve().parents[1] / "data" / "stories" / "audio"
    audio_url = f"/audio/stories/{audio_filename}"

    if not dry_run:
        web_audio_dir.mkdir(parents=True, exist_ok=True)
        backup_audio_dir.mkdir(parents=True, exist_ok=True)
        with open(web_audio_dir / audio_filename, "wb") as f_web:
            f_web.write(mp3_bytes)
        with open(backup_audio_dir / audio_filename, "wb") as f_backup:
            f_backup.write(mp3_bytes)
        print(f"      -> Saved audio to: {web_audio_dir / audio_filename}")

    # 3. Database insert
    if not dry_run:
        import psycopg
        print(f"   💾 [3/3] Inserting into PostgreSQL...")
        conn = psycopg.connect(db_url())
        try:
            story_id = str(uuid.uuid4())
            with conn.transaction():
                with conn.cursor() as cur:
                    # Delete old rows if re-ingesting same slug
                    cur.execute("DELETE FROM stories WHERE slug = %s", (slug,))

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
            conn.commit()
            print(f"   ✅ Successfully ingested '{slug}' into database with {len(sentence_records)} sentences!")
        finally:
            conn.close()
    else:
        print(f"   [DRY-RUN] Would insert '{slug}' into database with {len(sentence_records)} sentences.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crawl children's storybooks from StoryWeaver with scene illustrations."
    )
    parser.add_argument(
        "--url",
        type=str,
        required=True,
        help="StoryWeaver URL, slug, ID, or search title (e.g. https://storyweaver.org.in/stories/16411-too-big-too-small)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "stories" / "source_stories.json",
        help="Target source_stories.json path (default: apps/api/data/stories/source_stories.json)",
    )
    parser.add_argument(
        "--ingest",
        action="store_true",
        help="Run end-to-end ingestion directly into PostgreSQL with edge-tts audio and DeepSeek translation",
    )
    parser.add_argument(
        "--voice",
        type=str,
        default="en-US-AriaNeural",
        help="edge-tts voice to use when --ingest is enabled (default: en-US-AriaNeural)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate run without writing to disk or database",
    )
    return parser.parse_args()


async def main() -> None:
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    args = parse_args()
    load_env()

    session = create_session()
    story_obj = crawl_story(args.url, session)

    if not args.dry_run:
        save_to_source_stories(story_obj, args.output)
    else:
        print("🔍 [DRY-RUN] Skipping save to source_stories.json.")

    if args.ingest:
        await ingest_crawled_story(story_obj, voice=args.voice, dry_run=args.dry_run)


if __name__ == "__main__":
    asyncio.run(main())
