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
		<section className="surface-card flex h-full flex-col gap-4 p-5">
			<div className="flex flex-wrap items-center gap-2">
				<span className="size-2 rounded-full bg-secondary" />
				<span className="text-xs font-bold text-foreground">
					{m["lessons.reading.questionOf"]({
						number: questionNumber,
						total: totalQuestions,
					})}
				</span>
				<span className="chip bg-accent ml-auto px-2 py-0 text-[11px]">
					{question.instruction}
				</span>
			</div>
			<h2 className="text-lg font-bold text-foreground">{question.stem}</h2>
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
			<div className="mt-auto flex items-center justify-between gap-2 pt-1">
				<Button
					type="button"
					variant="ghost"
					className="btn btn-outline"
					onClick={onPrev}
					disabled={questionNumber === 1}
				>
					{m["lessons.reading.previousQuestion"]()}
				</Button>
				<Button
					type="button"
					className={isLast ? "btn btn-primary" : "btn btn-outline"}
					onClick={isLast ? onContinue : onNext}
				>
					{isLast
						? m["common.actions.continue"]()
						: m["lessons.reading.nextQuestion"]()}
				</Button>
			</div>
		</section>
	);
}
