"""Warm the OpenPronounce container's models (one ~20 s load per container start).

Posts a silent one-second wav to /pronunciation so the two Wav2Vec2
checkpoints load now rather than on the first learner attempt. Run via
`make pronounce-warm` after `docker compose up -d openpronounce`.
"""

import io
import os
import sys
import time
import urllib.error
import urllib.request
import wave

BASE_URL = os.environ.get("PRONOUNCE_SERVICE_URL", "http://localhost:8001").rstrip("/")


def silent_wav_bytes(seconds: float = 1.0, sample_rate: int = 16000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(b"\x00\x00" * int(sample_rate * seconds))
    return buf.getvalue()


def main() -> int:
    boundary = "----warm-pronounce"
    body = b"".join(
        [
            f'--{boundary}\r\nContent-Disposition: form-data; name="expected_text"\r\n\r\nwarm up\r\n'.encode(),
            f'--{boundary}\r\nContent-Disposition: form-data; name="lang"\r\n\r\nen\r\n'.encode(),
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="warm.wav"\r\nContent-Type: audio/wav\r\n\r\n'.encode(),
            silent_wav_bytes(),
            f"\r\n--{boundary}--\r\n".encode(),
        ]
    )
    request = urllib.request.Request(
        f"{BASE_URL}/pronunciation",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    start = time.time()
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            response.read()
    except urllib.error.URLError as exc:
        print(f"warmup failed: {exc} — is the openpronounce container up?", file=sys.stderr)
        return 1
    print(f"pronounce engine warm in {time.time() - start:.1f}s ({BASE_URL})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
