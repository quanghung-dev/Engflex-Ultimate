import {
	AudioWaveform,
	BookOpen,
	type LucideIcon,
	Mic,
	PenLine,
} from "lucide-react";
import { m } from "#/paraglide/messages";

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

const PART_LABELS: Record<
	LessonPart,
	{ label: () => string; icon: LucideIcon }
> = {
	reading: { label: () => m["lessons.part.reading"](), icon: BookOpen },
	dictation: {
		label: () => m["lessons.part.dictation"](),
		icon: AudioWaveform,
	},
	writing: { label: () => m["lessons.part.writing"](), icon: PenLine },
	voice: { label: () => m["lessons.part.voice"](), icon: Mic },
};

export const PART_META = PART_LABELS;

/** Next part in order, or undefined when this is the last part of the lesson. */
export function getNextPart(
	part: LessonPart,
	partCount: number,
): LessonPart | undefined {
	const index = LESSON_PART_TYPES.indexOf(part);
	if (index < 0) return undefined;
	return index + 1 < partCount ? LESSON_PART_TYPES[index + 1] : undefined;
}
