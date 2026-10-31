import { CardShell } from "#/components/common/card-shell";
import {
	type AnswersById,
	questionStatus,
	type ReviewPart,
} from "#/features/exams/review";
import { m } from "#/paraglide/messages";

export function ToeicResultPaletteCard({
	parts,
	answers,
	onNavigateQuestion,
}: {
	parts: ReviewPart[];
	answers: AnswersById;
	onNavigateQuestion: (id: string, part: number) => void;
}) {
	return (
		<CardShell className="flex flex-col gap-5 p-6">
			<h2 className="font-bold">
				{m["exams.toeic.result.questionPaletteTitle"]()}
			</h2>
			{parts.map((part) => (
				<div key={part.partNumber} className="flex flex-col gap-2">
					<h3 className="text-sm font-semibold">
						{m["exams.toeic.result.review.part"]({ part: part.partNumber })}
					</h3>
					<div className="flex flex-wrap gap-1.5">
						{part.items.map((item) =>
							item.questions.map((question) => {
								const status = questionStatus(question, answers);
								return (
									<button
										type="button"
										key={question.id}
										data-question-status={status}
										onClick={() =>
											onNavigateQuestion(question.id, part.partNumber)
										}
										aria-label={m["exams.toeic.result.review.question"]({
											number: question.questionNumber,
										})}
										className={`size-8 rounded-full border text-xs font-semibold ${status === "correct" ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : status === "incorrect" ? "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300" : "border-border bg-muted text-muted-foreground"}`}
									>
										{question.questionNumber}
									</button>
								);
							}),
						)}
					</div>
				</div>
			))}
			<div className="flex flex-wrap gap-4 border-t pt-4 text-xs">
				<span className="text-emerald-600">
					{m["exams.toeic.result.legendCorrect"]()}
				</span>
				<span className="text-rose-600">
					{m["exams.toeic.result.legendIncorrect"]()}
				</span>
				<span className="text-muted-foreground">
					{m["exams.toeic.result.legendSkipped"]()}
				</span>
			</div>
		</CardShell>
	);
}
