import type { Question } from "@engflex/contracts";
import { Button } from "#/components/ui/button";
import { RadioGroup } from "#/components/ui/radio-group";
import { m } from "#/paraglide/messages";
import { McqOption } from "./mcq-option";

export function QuestionPanel({
	question,
	questionNumber,
	totalQuestions,
	selectedKey,
	onSelect,
	onPrev,
	onNext,
	isLast,
	onContinue,
}: {
	question: Question;
	questionNumber: number;
	totalQuestions: number;
	selectedKey: string | undefined;
	onSelect: (key: string) => void;
	onPrev: () => void;
	onNext: () => void;
	isLast: boolean;
	onContinue: () => void;
}) {
	return (
		<section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<div className="flex flex-col gap-1">
				<span className="text-xs font-semibold text-muted-foreground">
					{m["lessons.questionOf"]({
						number: questionNumber,
						total: totalQuestions,
					})}
				</span>
				<h2 className="text-base font-bold tracking-tight text-foreground">
					{question.stem}
				</h2>
				<p className="text-xs text-muted-foreground">{question.instruction}</p>
			</div>
			<RadioGroup
				value={selectedKey ?? ""}
				onValueChange={onSelect}
				className="flex flex-col gap-2"
			>
				{question.options.map((option) => (
					<McqOption
						key={option.key}
						id={`option-${questionNumber}-${option.key}`}
						value={option.key}
						label={option.key}
						text={option.text}
						selected={selectedKey === option.key}
					/>
				))}
			</RadioGroup>
			<div className="flex items-center justify-between gap-2 border-t pt-4">
				<Button
					type="button"
					variant="ghost"
					onClick={onPrev}
					disabled={questionNumber === 1}
				>
					{m["common.previousQuestion"]()}
				</Button>
				<Button
					type="button"
					variant={isLast ? "default" : "outline"}
					onClick={isLast ? onContinue : onNext}
				>
					{isLast ? m["common.continue"]() : m["lessons.nextQuestion"]()}
				</Button>
			</div>
		</section>
	);
}
