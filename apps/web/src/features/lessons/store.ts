import type { Activity, LessonStatus } from "@engflex/contracts";
import { Store } from "@tanstack/store";

/** Local-only progress derivation (never a wire shape). Mirrors the
 *  removed contract LessonProgress field for field. */
export interface LessonProgress {
	status: LessonStatus;
	percent: number /* int */;
	partsCompleted: number /* int */;
	partsTotal: number /* int */;
	bookmarked: boolean;
	savedAt?: string /* RFC3339 */;
}

export type LessonsState = {
	completedParts: Record<string, number[]>;
	/** Activity totals learned when a part completes (the practice page knows
	 *  the activity list); lets hub-level reads size `done/total` without a
	 *  server count field. */
	lessonTotals: Record<string, number>;
	bookmarks: Record<string, string>;
};

/** Local-only progress until attempts land. Keys are lesson ids. */
export const lessonsStore = new Store<LessonsState>({
	completedParts: {},
	lessonTotals: {},
	bookmarks: {},
});

/** Pure derivation — usable from a `useStore` selector for reactive reads.
 *  `fallbackTotal` is the caller's freshly fetched activity count; 0/undefined
 *  means "not known yet", so the learned total (if any) is used instead. */
export function progressFrom(
	state: LessonsState,
	lessonId: string,
	fallbackTotal?: number,
): LessonProgress {
	const completed = state.completedParts[lessonId] ?? [];
	const partsCompleted = completed.length;
	const partsTotal =
		fallbackTotal && fallbackTotal > 0
			? fallbackTotal
			: (state.lessonTotals[lessonId] ?? 0);
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

/** First activity without a completion entry; a finished lesson restarts at the first. */
export function getFirstIncompleteActivity(
	lessonId: string,
	activities: Activity[],
): Activity | undefined {
	const completed = lessonsStore.state.completedParts[lessonId] ?? [];
	return (
		activities.find((activity) => !completed.includes(activity.partNumber)) ??
		activities[0]
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

export function completePart(
	lessonId: string,
	partNumber: number,
	partsTotal: number,
): void {
	lessonsStore.setState((state) => {
		const current = state.completedParts[lessonId] ?? [];
		const lessonTotals = { ...state.lessonTotals, [lessonId]: partsTotal };
		if (current.includes(partNumber)) return { ...state, lessonTotals };
		return {
			...state,
			lessonTotals,
			completedParts: {
				...state.completedParts,
				[lessonId]: [...current, partNumber].sort((a, b) => a - b),
			},
		};
	});
}
