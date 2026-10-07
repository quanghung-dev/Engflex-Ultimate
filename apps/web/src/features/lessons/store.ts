import type { LessonProgress, LessonStatus } from "@engflex/contracts";
import { Store } from "@tanstack/store";
import type { LessonPart } from "#/features/lessons/parts";
import { LESSON_PART_TYPES } from "#/features/lessons/parts";

export type LessonsState = {
	completedParts: Record<string, number[]>;
	bookmarks: Record<string, string>;
};

/** Local-only progress until attempts land. Keys are lesson ids. */
export const lessonsStore = new Store<LessonsState>({
	completedParts: {},
	bookmarks: {},
});

/** Pure derivation — usable from a `useStore` selector for reactive reads. */
export function progressFrom(
	state: LessonsState,
	lessonId: string,
	partsTotal: number,
): LessonProgress {
	const completed = state.completedParts[lessonId] ?? [];
	const partsCompleted = completed.length;
	const percent =
		partsTotal === 0 ? 0 : Math.round((partsCompleted / partsTotal) * 100);
	const status: LessonStatus =
		percent === 0 ? "unstarted" : percent >= 100 ? "completed" : "in_progress";
	const savedAt = state.bookmarks[lessonId];
	return {
		status,
		percent,
		partsCompleted,
		partsTotal,
		bookmarked: Boolean(savedAt),
		savedAt,
	};
}

/** First part without a completion entry; a finished lesson restarts at part 1. */
export function getFirstIncompletePart(
	lessonId: string,
	partsTotal: number,
): LessonPart {
	const completed = lessonsStore.state.completedParts[lessonId] ?? [];
	const parts = LESSON_PART_TYPES.slice(0, partsTotal);
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
		else next[lessonId] = new Date().toISOString();
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
