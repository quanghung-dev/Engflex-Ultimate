import type { TurnFeedback } from "@engflex/contracts";

/** mock-only: no contract type yet — scripted studio events. */
export type StudioEvent =
	| { kind: "ai"; text: string; delayMs: number }
	| { kind: "user"; text: string; delayMs: number; feedback?: TurnFeedback };

export interface SessionScript {
	scenarioId: string;
	/** Scheduled length used by the timer's "/ total" label. */
	totalSec: number;
	events: StudioEvent[];
}

export type SessionStatus = "idle" | "live" | "paused" | "ended";
