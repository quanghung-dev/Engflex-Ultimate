/** Order mirrors the lesson detail mock: Part 1 reading → Part 4 voice. */
export const LESSON_PART_TYPES = [
	"reading",
	"dictation",
	"writing",
	"voice",
] as const;

export type LessonPart = (typeof LESSON_PART_TYPES)[number];

export function isLessonPart(value: string): value is LessonPart {
	return (LESSON_PART_TYPES as readonly string[]).includes(value);
}
