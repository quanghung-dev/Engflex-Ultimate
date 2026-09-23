import type { Activity, Lesson } from "@engflex/contracts";

/** mock-only: no contract type yet — outcomes card data (Spec 2 §4.4). */
export interface LessonOutcome {
	outcomes: string[];
}

export interface LessonDetailFixture {
	lesson: Lesson;
	activities: Activity[];
	outcomes: string[];
}
