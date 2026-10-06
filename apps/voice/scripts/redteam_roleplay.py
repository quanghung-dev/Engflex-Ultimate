"""Red-team the roleplay prompt against adversarial + legit turns.

Runs every item in redteam_items.json through the session LLM with the
current build_system_prompt, one turn per scenario. Re-run after any prompt
change and diff the verdicts: fixing one case must not break another.

Usage (from apps/voice):  uv run python scripts/redteam_roleplay.py
Writes /tmp/opencode/redteam-results.json by default.
"""

import json
import sys
import time

sys.path.insert(0, "src")

from openai import OpenAI

from app.schemas import PersonaBody, ScenarioBody
from config import settings
from prompts import build_system_prompt

SCENARIOS = [
    (
        PersonaBody(
            name="Sarah",
            roleTitle="Staff engineer",
            personality="Analytical, sceptical",
            style="Architecture design review",
            objective="Stress-test the caching and failover decisions",
        ),
        ScenarioBody(
            title="Architecture design review",
            objective="Stress-test the caching and failover decisions",
            cefrLevel="C1",
        ),
        "C1",
        ("I'm Sarah, a staff engineer. Today we'll stress-test your caching and "
         "failover decisions. How would you design caching for a high-traffic product page?"),
    ),
    (
        PersonaBody(
            name="Amelia",
            roleTitle="Hiring director",
            personality="Warm but exacting",
            style="Structured behavioural interviews",
            objective="Assess leadership stories for measurable outcomes",
        ),
        ScenarioBody(
            title="Job interview simulation",
            objective="Assess leadership stories for measurable outcomes",
            cefrLevel="B2",
        ),
        "B2",
        ("Hi, I'm Amelia, a hiring director. Let's talk about a time you led a team "
         "through a missed deadline. What happened?"),
    ),
]


def main(out_path: str = "/tmp/opencode/redteam-results.json") -> None:
    with open("scripts/redteam_items.json", encoding="utf-8") as f:
        items = json.load(f)
    client = OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        default_headers={"User-Agent": settings.llm_user_agent},
    )
    print(f"model={settings.llm_model} items={len(items)}", flush=True)
    results = []
    for item in items:
        persona, scenario, level, greeting = SCENARIOS[item["sc"]]
        prompt = build_system_prompt(level, persona=persona, scenario=scenario)
        t0 = time.perf_counter()
        r = client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Hello!"},
                {"role": "assistant", "content": greeting},
                {"role": "user", "content": item["turn"]},
            ],
        )
        dt = (time.perf_counter() - t0) * 1000
        reply = r.choices[0].message.content or ""
        u = r.usage
        print(f"\n=== {item['id']} [{item['cat']}] expect={item['expect']} ({dt:.0f}ms) ===")
        print(f"U: {item['turn']}\nA: {reply}")
        results.append(
            {**item, "reply": reply, "ms": round(dt),
             "prompt_tokens": u.prompt_tokens, "completion_tokens": u.completion_tokens}
        )
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=1, ensure_ascii=False)
    print(f"\nwrote {out_path}", flush=True)


if __name__ == "__main__":
    main()
