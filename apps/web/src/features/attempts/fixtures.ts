import type { ProgressSummary } from "@engflex/contracts";

/** mock-only: dashboard rollup until the attempts progress endpoint exists. */
export const PROGRESS_SUMMARY: ProgressSummary = {
	streakDays: 14,
	todayMinutes: 32,
	dailyGoalMinutes: 45,
	fluencyPct: 88,
	pronunciationPct: 92,
	wpm: 138,
	dueVocabulary: 24,
};

/** mock-only: no contract type yet — dashboard "Today's practice sequence" rows. */
/** Typed navigation target: dynamic routes carry their params. */
export type SequenceTarget =
	| { kind: "lesson"; lessonId: string }
	| { kind: "route"; to: "/voice/scenarios" | "/vocabulary" };

export interface SequenceCard {
	id: string;
	durationMin: number;
	state: "done" | "up-next" | "queued" | "due";
	scorePct?: number;
	dueCount?: number;
	/** Navigate target; absent = replay-only (toast). */
	target?: SequenceTarget;
}

/** Verbatim from the dashboard mock's sequence row. */
export const SEQUENCE_CARDS: SequenceCard[] = [
	{
		id: "shadowing",
		durationMin: 8,
		state: "done",
		scorePct: 94,
	},
	{
		id: "dictation",
		durationMin: 12,
		state: "up-next",
		target: { kind: "lesson", lessonId: "describing-your-job" },
	},
	{
		id: "roleplay",
		durationMin: 15,
		state: "queued",
		target: { kind: "route", to: "/voice/scenarios" },
	},
	{
		id: "spaced",
		durationMin: 5,
		state: "due",
		dueCount: 18,
		target: { kind: "route", to: "/vocabulary" },
	},
];
