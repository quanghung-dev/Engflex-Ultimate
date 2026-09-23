import type { ConversationMode, Persona, Scenario } from "@engflex/contracts";
import { m } from "#/paraglide/messages";
import type { SessionScript } from "./types";

const STUDIO_SCENARIO_ID = "scenario-04";

/**
 * Bespoke script for the studio mock's scenario ("Architectural RFC & database
 * tradeoff defense", persona Sarah) — dialogue and diagnostics copied verbatim,
 * except the tip which the mock left to coaching copy.
 */
export const STUDIO_SCRIPT: SessionScript = {
	scenarioId: STUDIO_SCENARIO_ID,
	totalSec: 600,
	events: [
		{
			kind: "ai",
			delayMs: 1200,
			text: "Good morning Daniel. I reviewed the caching proposal. Why did you choose Redis over direct PostgreSQL read-replicas for the session tier?",
		},
		{
			kind: "user",
			delayMs: 2500,
			text: "We evaluated both options, but our primary concern was tail latency under peak traffic. Redis allows sub-millisecond lookups which keeps our API SLA under 80ms.",
			feedback: {
				annotated:
					"We evaluated both options, but our primary concern was tail latency under peak traffic.",
				marks: [
					{ word: "evaluated", status: "accurate" },
					{ word: "both", status: "accurate" },
					{ word: "primary concern", status: "error" },
					{ word: "tail", status: "warning" },
					{ word: "latency", status: "accurate" },
				],
				phonemes: [
					{
						ipa: "/θ/",
						word: "both",
						feature: "dental fricative",
						accuracyPct: 92,
						label: "Precise",
					},
					{
						ipa: "/tʰ/",
						word: "tail",
						feature: "aspiration",
						accuracyPct: 74,
						label: "Softened",
					},
				],
				upgrades: [
					{
						original: "primary concern",
						replacements: ["decisive constraint", "critical priority"],
						category: "Executive upgrade",
					},
				],
				tip: 'Slow down slightly on the /tʰ/ release in "tail" so the aspiration stays crisp in connected speech.',
			},
		},
		{
			kind: "ai",
			delayMs: 2600,
			text: "That makes sense for latency, but what is your contingency plan if the Redis cluster drops nodes during failover?",
		},
		{
			kind: "user",
			delayMs: 2500,
			text: "We configured Redis Sentinel with automated failover and fallback replicas to protect write availability during node loss.",
		},
	],
};

/** Deterministic template for the scenarios without a bespoke script. */
export function buildGenericScript(
	scenario: Scenario,
	persona?: Persona,
): SessionScript {
	const partner = persona?.roleTitle ?? m["voice.room.partnerFallback"]();
	return {
		scenarioId: scenario.id,
		totalSec: Math.max(1, scenario.durationMax) * 60,
		events: [
			{
				kind: "ai",
				delayMs: 1200,
				text: `Thanks for making the time. Let's work through "${scenario.title}". As ${partner}, my focus is: ${scenario.objective}`,
			},
			{
				kind: "user",
				delayMs: 2400,
				text: "Let me lay out where we stand and the constraints I need you to weigh before we decide.",
			},
			{
				kind: "ai",
				delayMs: 2600,
				text: "That's the context I needed. What is your recommendation, and what would change your mind?",
			},
			{
				kind: "user",
				delayMs: 2400,
				text: "My recommendation is to stage the rollout, measure the two riskiest assumptions, and revisit the timeline next week.",
			},
		],
	};
}

/** Free talk has no scenario — a generic partner warm-up. */
export function buildFreeTalkScript(): SessionScript {
	return {
		scenarioId: "free_talk",
		totalSec: 600,
		events: [
			{
				kind: "ai",
				delayMs: 1200,
				text: "Let's warm up. Tell me about the project you are most excited about right now.",
			},
			{
				kind: "user",
				delayMs: 2400,
				text: "I'm leading a payments reliability project where we are cutting p99 latency without changing the public API.",
			},
			{
				kind: "ai",
				delayMs: 2600,
				text: "Nice. What was the hardest trade-off you had to defend to stakeholders?",
			},
			{
				kind: "user",
				delayMs: 2400,
				text: "We deferred a redesign to keep the migration reversible, which bought us the confidence to ship earlier.",
			},
		],
	};
}

export function buildSessionScript(
	mode: ConversationMode,
	scenario?: Scenario,
): SessionScript {
	if (mode === "free_talk" || !scenario) return buildFreeTalkScript();
	if (scenario.id === STUDIO_SCRIPT.scenarioId) return STUDIO_SCRIPT;
	return buildGenericScript(scenario, scenario.persona);
}
