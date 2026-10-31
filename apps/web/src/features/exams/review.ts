import type { ExamReviewAttempt, ExamReviewContent } from "@engflex/contracts";
import { toeicPartLabel } from "./parts";

export type ReviewPart = ExamReviewContent["parts"][number];
export type ReviewItem = ReviewPart["items"][number];
export type ReviewQuestion = ReviewItem["questions"][number];
export type ReviewBlock = ReviewItem["media"][number];
export type ReviewAudio = NonNullable<ReviewItem["itemAudio"]>;
export type ReviewAnswer = NonNullable<
	ExamReviewAttempt["result"]
>["answers"][number];
export type AnswersById = ReadonlyMap<string, ReviewAnswer>;
export type ReviewFilter = "all" | "incorrect" | "correct";

export function questionStatus(
	question: ReviewQuestion,
	answers: AnswersById,
): "correct" | "incorrect" | "skipped" {
	const selected = answers.get(question.id)?.selectedKey;
	if (!selected) return "skipped";
	return question.correctKey !== null && selected === question.correctKey
		? "correct"
		: "incorrect";
}
export function partStatistics(part: ReviewPart, answers: AnswersById) {
	return {
		partNum: part.partNumber,
		name: toeicPartLabel(part.partNumber),
		totalQuestions: part.items.reduce(
			(sum, item) => sum + item.questions.length,
			0,
		),
		correctCount: part.items.reduce(
			(sum, item) =>
				sum +
				item.questions.filter((q) => questionStatus(q, answers) === "correct")
					.length,
			0,
		),
	};
}
export function mediaSource(
	assetId: string | null | undefined,
	assets: ExamReviewContent["assets"],
): string | null {
	if (!assetId || !assets.some((asset) => asset.sourceId === assetId))
		return null;
	try {
		const url = new URL(assetId);
		return url.protocol === "https:" || url.protocol === "http:"
			? url.href
			: null;
	} catch {
		return null;
	}
}
