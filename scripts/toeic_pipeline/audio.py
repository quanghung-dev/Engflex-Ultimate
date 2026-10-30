import importlib.metadata
import re

from extractors import source_path
from pipeline_io import DATA, VERSION, digest, read, write
from schemas import AudioRange


def transcribe(source, model="small.en", device="cpu", compute="int8"):
    from faster_whisper import WhisperModel

    config = {
        "source": source["sha256"],
        "model": model,
        "device": device,
        "compute": compute,
        "version": VERSION,
        "engine": importlib.metadata.version("faster-whisper"),
        "ctranslate2": importlib.metadata.version("ctranslate2"),
    }
    dest = DATA / "cache" / f"asr_{digest(config)}.json"
    if dest.exists():
        return read(dest)
    engine = WhisperModel(
        model, device=device, compute_type=compute, cpu_threads=6, download_root=str(DATA / "models")
    )
    segments, info = engine.transcribe(
        str(source_path(source["sourceId"])),
        language="en",
        word_timestamps=True,
        vad_filter=True,
        beam_size=5,
    )
    result = []
    for segment in segments:
        result.append(
            {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
                "words": [
                    {"word": w.word, "start": w.start, "end": w.end, "probability": w.probability}
                    for w in segment.words or []
                ],
            }
        )
        print(f"ASR {segment.end:.1f}/{source['duration']:.1f}: {segment.text[:70]}", flush=True)
    artifact = {"config": config, "language": info.language, "segments": result}
    write(dest, artifact)
    return artifact


def align(items, segments, asset_id):
    """Monotone candidate alignment. Never verifies itself or invents times."""
    from rapidfuzz.fuzz import ratio

    cursor = 0
    matches = []

    def normalize(t):
        return re.sub(r"[^a-z0-9 ]", "", t.lower().replace("-", " "))

    ones = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
    tens = "zero ten twenty thirty forty fifty sixty seventy eighty ninety".split()

    def spoken(n):
        return ones[n] if n < 20 else tens[n // 10] + (" " + ones[n % 10] if n % 10 else "")

    anchors = {}
    anchor_cursor = 0
    for item in items:
        n = item.questions[0].questionNumber
        token = "number" if n <= 31 else "questions"
        for index in range(anchor_cursor, len(segments)):
            text = normalize(segments[index]["text"]).strip()
            alternatives = [str(n), spoken(n)]
            if any(re.match(rf"^{token}\s+{value}\b", text) for value in alternatives):
                anchors[item.id] = index
                anchor_cursor = index + 1
                break

    for item in items:
        transcript = " ".join(line.text for line in item.transcript)
        if not transcript:
            continue
        target = normalize(transcript)
        best = None
        # Candidate windows are scored in original order; no backwards jumps.
        anchor = anchors.get(item.id)
        later = [v for v in anchors.values() if anchor is not None and v > anchor]
        limit = min(later) if later else len(segments)
        if anchor is not None:
            final = limit - 1
            # Exclude closing instructions from the last item.
            for j in range(anchor + 1, limit):
                if re.match(
                    r"\s*(this is the end|end of the listening|part [234]\b)",
                    segments[j]["text"],
                    re.IGNORECASE,
                ):
                    final = j - 1
                    break
            item.itemAudio = AudioRange(
                assetId=asset_id, startTime=segments[anchor]["start"], endTime=segments[final]["end"]
            )
        for start in range(anchor if anchor is not None else cursor, limit):
            text = ""
            for end in range(start, min(start + 35, limit)):
                text += " " + normalize(segments[end]["text"])
                if len(text) > len(target) * 1.7 + 100:
                    break
                score = ratio(target, text.strip())
                if best is None or score > best[0]:
                    best = (score, start, end)
        if best and best[0] >= 75:
            score, start, end = best
            item.stimulusAudio = AudioRange(
                assetId=asset_id, startTime=segments[start]["start"], endTime=segments[end]["end"]
            )
            # Alignment is a candidate only: item boundary needs narrator/questions.
            cursor = end + 1
            matches.append({"itemId": item.id, "similarity": score, "status": "needsReview"})
    return matches
