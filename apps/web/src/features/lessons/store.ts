import type { LessonProgress, LessonStatus } from "@engflex/contracts";
import { Store } from "@tanstack/store";
import type { LessonPart } from "#/features/lessons/parts";
import { LESSON_PART_TYPES } from "#/features/lessons/parts";
import { LESSONS } from "./fixtures";

export type LessonsState = {
	completedParts: Record<string, number[]>;
	bookmarks: Record<string, string>;
};

/**
 * mock-only seed. Deterministic: `negotiating-project-timelines` is seeded 2/4
 * so the dashboard's active-lesson card reads 50%, as in the mock.
 */
const SEEDS: LessonsState = {
	completedParts: {
		"describing-your-job": [],
		"leading-sprint-reviews": [1, 2],
		"disagreeing-politely-in-meetings": [1, 2],
		"writing-blocker-memos": [1, 2, 3],
		"navigating-fast-paced-dialogues": [1],
		"de-escalating-team-tensions": [],
		"defining-acceptance-criteria": [1, 2],
		"analyzing-earnings-reports": [],
		"negotiating-project-timelines": [1, 2],
	},
	bookmarks: {},
};

export const lessonsStore = new Store<LessonsState>(SEEDS);

/** Pure derivation — usable from a `useStore` selector for reactive reads. */
export function progressFrom(
	state: LessonsState,
	lessonId: string,
): LessonProgress {
	const lesson = LESSONS.find((item) => item.id === lessonId);
	const total = lesson?.partCount ?? 0;
	const completed = state.completedParts[lessonId] ?? [];
	const partsCompleted = completed.length;
	const percent = total === 0 ? 0 : Math.round((partsCompleted / total) * 100);
	const status: LessonStatus =
		percent === 0 ? "unstarted" : percent >= 100 ? "completed" : "in_progress";
	const savedAt = state.bookmarks[lessonId];
	return {
		status,
		percent,
		partsCompleted,
		partsTotal: total,
		bookmarked: Boolean(savedAt),
		savedAt,
	};
}

export function getLessonProgress(lessonId: string): LessonProgress {
	return progressFrom(lessonsStore.state, lessonId);
}

/** First part without a completion entry; a finished lesson restarts at part 1. */
export function getFirstIncompletePart(lessonId: string): LessonPart {
	const completed = lessonsStore.state.completedParts[lessonId] ?? [];
	const total = LESSONS.find((item) => item.id === lessonId)?.partCount ?? 0;
	const parts = LESSON_PART_TYPES.slice(0, total);
	return (
		parts.find((_, index) => !completed.includes(index + 1)) ??
		parts[0] ??
		"reading"
	);
}

export function toggleBookmark(lessonId: string): void {
	lessonsStore.setState((state) => {
		const next = { ...state.bookmarks };
		if (next[lessonId]) delete next[lessonId];
		else next[lessonId] = "2026-05-18T09:00:00Z";
		return { ...state, bookmarks: next };
	});
}

export function completePart(lessonId: string, partNumber: number): void {
	lessonsStore.setState((state) => {
		const current = state.completedParts[lessonId] ?? [];
		if (current.includes(partNumber)) return state;
		return {
			...state,
			completedParts: {
				...state.completedParts,
				[lessonId]: [...current, partNumber].sort((a, b) => a - b),
			},
		};
	});
}
