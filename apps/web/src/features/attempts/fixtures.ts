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
