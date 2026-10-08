import type { CheckResult, Question } from "@engflex/contracts";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "#/components/ui/button";
import { RadioGroup } from "#/components/ui/radio-group";
import { McqOption } from "#/features/lessons/components/reading/mcq-option";
import { m } from "#/paraglide/messages";

/**
 * Shared checkable question panel for reading + listening. One question at a
 * time: select → check (locks the question) → review the result → advance.
 * The parent owns the check mutation and the per-question result map.
 */
export function CheckQuestionPanel({
	question,
	questionNumber,
	totalQuestions,
	selectedKey,
	result,
	onSelect,
	onCheck,
	onNext,
	onPrev,
	isLast,
	onContinue,
	pending,
}: {
	question: Question;
	questionNumber: number;
	totalQuestions: number;
	selectedKey: string | undefined;
	result: CheckResult | undefined;
	onSelect: (key: string) => void;
	onCheck: () => void;
	onNext: () => void;
	onPrev: () => void;
	isLast: boolean;
	onContinue: () => void;
	pending: boolean;
}) {
	const locked = result !== undefined;

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
				onValueChange={locked ? undefined : onSelect}
				disabled={locked}
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
						disabled={locked}
						tone={
							!locked
								? "default"
								: option.key === result.correctKey
									? "correct"
									: option.key === selectedKey
										? "wrong"
										: "default"
						}
					/>
				))}
			</RadioGroup>
			{result ? (
				<div className="flex flex-col gap-2">
					<span
						className={
							result.correct
								? "inline-flex items-center gap-1.5 text-sm font-bold text-accuracy"
								: "inline-flex items-center gap-1.5 text-sm font-bold text-ai-coral"
						}
					>
						{result.correct ? (
							<CircleCheck aria-hidden="true" className="size-4" />
						) : (
							<CircleX aria-hidden="true" className="size-4" />
						)}
						{result.correct
							? m["lessons.check.correct"]()
							: m["lessons.check.incorrect"]({ key: result.correctKey })}
					</span>
					<div className="flex flex-col gap-1 rounded-[16px] border-2 border-border bg-accent p-3">
						<span className="text-xs font-bold text-muted-foreground">
							{m["lessons.check.explanation"]()}
						</span>
						<p className="text-[15px] font-medium text-foreground">
							{result.explanation}
						</p>
					</div>
				</div>
			) : null}
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
					className="btn btn-outline"
					onClick={onCheck}
					disabled={selectedKey === undefined || locked || pending}
				>
					{m["lessons.check.submit"]()}
				</Button>
				<Button
					type="button"
					className={isLast ? "btn btn-primary" : "btn btn-outline"}
					onClick={isLast ? onContinue : onNext}
					disabled={!locked}
				>
					{isLast
						? m["common.actions.continue"]()
						: m["lessons.reading.nextQuestion"]()}
				</Button>
			</div>
		</section>
	);
}
