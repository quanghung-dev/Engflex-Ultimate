import type { ExamTestMetadata } from "@engflex/contracts";
import { m } from "#/paraglide/messages";
import type { ToeicPartItem } from "./components/toeic-parts-breakdown";

const PART_LABELS: Record<number, () => string> = {
	1: () => m["exams.toeic.test.parts.photos"](),
	2: () => m["exams.toeic.test.parts.responses"](),
	3: () => m["exams.toeic.test.parts.conversations"](),
	4: () => m["exams.toeic.test.parts.talks"](),
	5: () => m["exams.toeic.test.parts.sentences"](),
	6: () => m["exams.toeic.test.parts.completion"](),
	7: () => m["exams.toeic.test.parts.comprehension"](),
};

export function toeicParts(
	content: ExamTestMetadata["content"],
): ToeicPartItem[] {
	return (content?.parts ?? []).map((part) => ({
		partNumber: part.partNumber,
		section: part.section === "listening" ? "listening" : "reading",
		type: PART_LABELS[part.partNumber]?.() ?? "",
		questionsCount: part.questionCount,
	}));
}

export function toeicPartLabel(partNumber: number): string {
	return PART_LABELS[partNumber]?.() ?? "";
}
