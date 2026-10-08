import type {
	Category,
	Lesson,
	Persona,
	Scenario,
	VideoCategoryResponse,
	VideoExerciseResponse,
	VideoTranscriptResponse,
	VocabularyCategoryResponse,
	VocabularyDeckDetail,
	VocabularyItem,
} from "@engflex/contracts";
import { Store } from "@tanstack/store";
import { CATEGORIES, LESSONS } from "#/features/lessons/fixtures";
import { VOCABULARY_ITEMS } from "#/features/vocabulary/fixtures";
import {
	ADMIN_PERSONAS,
	ADMIN_SCENARIOS,
	ADMIN_USERS,
	ADMIN_VIDEO_CATEGORIES,
	ADMIN_VIDEO_EXERCISES,
	ADMIN_VIDEO_TRANSCRIPTS,
	ADMIN_VOCABULARY_CATEGORIES,
	ADMIN_VOCABULARY_DECKS,
} from "./fixtures";
import type { AdminUser } from "./types";

/**
 * Mock-phase back office: one collection per table the API exposes, each row
 * typed by its wire contract so swapping a collection for a TanStack Query
 * later changes the data source, not the components.
 */
export interface AdminState {
	users: AdminUser[];
	vocabularyCategories: VocabularyCategoryResponse[];
	vocabularyDecks: VocabularyDeckDetail[];
	vocabularyItems: VocabularyItem[];
	videoCategories: VideoCategoryResponse[];
	videoExercises: VideoExerciseResponse[];
	videoTranscripts: VideoTranscriptResponse[];
	lessonCategories: Category[];
	lessons: Lesson[];
	scenarios: Scenario[];
	personas: Persona[];
}

export type AdminCollection = keyof AdminState;
export type AdminRow<K extends AdminCollection> = AdminState[K][number];

export const adminStore = new Store<AdminState>({
	users: ADMIN_USERS,
	vocabularyCategories: ADMIN_VOCABULARY_CATEGORIES,
	vocabularyDecks: ADMIN_VOCABULARY_DECKS,
	vocabularyItems: VOCABULARY_ITEMS,
	videoCategories: ADMIN_VIDEO_CATEGORIES,
	videoExercises: ADMIN_VIDEO_EXERCISES,
	videoTranscripts: ADMIN_VIDEO_TRANSCRIPTS,
	lessonCategories: CATEGORIES,
	lessons: LESSONS,
	scenarios: ADMIN_SCENARIOS,
	personas: ADMIN_PERSONAS,
});

/** Mock ids only — the API assigns uuids on create. */
export function newAdminId(prefix: string): string {
	return `${prefix}-${Date.now().toString(36)}`;
}

/** Insert, or replace the row with the same id (create and update share it). */
export function saveRow<K extends AdminCollection>(
	collection: K,
	row: AdminRow<K>,
): void {
	adminStore.setState((state) => {
		const rows = state[collection] as AdminRow<K>[];
		const exists = rows.some((current) => current.id === row.id);
		return syncNested(
			{
				...state,
				[collection]: exists
					? rows.map((current) => (current.id === row.id ? row : current))
					: [row, ...rows],
			},
			collection,
			row.id,
		);
	});
}

export function removeRow(collection: AdminCollection, id: string): void {
	adminStore.setState((state) => {
		const next = {
			...state,
			[collection]: (state[collection] as Array<{ id: string }>).filter(
				(row) => row.id !== id,
			),
		};
		// Transcript segments belong to their video (FK owner), so they go too.
		if (collection === "videoExercises") {
			next.videoTranscripts = state.videoTranscripts.filter(
				(segment) => segment.videoExerciseId !== id,
			);
		}
		return syncNested(next, collection, id);
	});
}

/**
 * The wire shapes nest some relations by value (`Scenario.persona`,
 * `Lesson.category`), so a parent edit must be copied into every embedding
 * row — or cleared when the parent is gone — exactly as a re-fetch would.
 */
function syncNested(
	state: AdminState,
	collection: AdminCollection,
	id: string,
): AdminState {
	if (collection === "personas") {
		const persona = state.personas.find((row) => row.id === id);
		return {
			...state,
			scenarios: state.scenarios.map((scenario) =>
				scenario.persona?.id === id ? { ...scenario, persona } : scenario,
			),
		};
	}
	if (collection === "lessonCategories") {
		const category = state.lessonCategories.find((row) => row.id === id);
		return {
			...state,
			lessons: state.lessons.map((lesson) =>
				lesson.category?.id === id ? { ...lesson, category } : lesson,
			),
		};
	}
	return state;
}
