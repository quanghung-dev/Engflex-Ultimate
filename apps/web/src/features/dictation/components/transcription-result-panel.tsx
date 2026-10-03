import { cn } from "cn";
import { CircleCheck } from "lucide-react";
import { Button } from "#/components/ui/button";
import { diffTokens } from "#/features/dictation/diff";
import { m } from "#/paraglide/messages";

export function TranscriptionResultPanel({
	typed,
	reference,
	remaining,
	continueLabel,
	onNext,
	onContinue,
}: {
	typed: string;
	reference: string;
	remaining: number;
	continueLabel: string;
	onNext: (() => void) | undefined;
	onContinue: () => void;
}) {
	const diff = diffTokens(typed, reference);
	// Key by character offset (tokens repeat, so text alone is not unique).
	const annotated: Array<{ key: string; token: (typeof diff)[number] }> = [];
	let offset = 0;
	for (const token of diff) {
		annotated.push({ key: `${offset}-${token.text}`, token });
		offset += token.text.length + 1;
	}

	return (
		<div className="surface-card flex flex-col gap-4 p-5">
			<div className="flex items-center gap-2">
				<CircleCheck className="size-4 text-accuracy" />
				<span className="text-sm font-bold text-foreground">
					{m["lessons.dictation.sentenceCompleted"]()}
				</span>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs font-bold text-muted-foreground">
					{m["lessons.dictation.typedLabel"]()}
				</span>
				<p className="text-[15px] font-medium">
					{annotated.map(({ key, token }) => (
						<span
							key={key}
							className={cn(
								"border-b-2 pb-0.5",
								token.status === "match"
									? "border-accuracy text-foreground"
									: "border-ai-coral text-ai-coral",
							)}
						>
							{token.text}{" "}
						</span>
					))}
				</p>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs font-bold text-muted-foreground">
					{m["lessons.dictation.referenceLabel"]()}
				</span>
				<p className="text-[15px] font-medium text-muted-foreground">
					“{reference}”
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-xs font-medium text-muted-foreground">
					{m["lessons.dictation.remaining"]({ count: remaining })}
				</span>
				<div className="flex items-center gap-2">
					{onNext ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="btn btn-outline"
							onClick={onNext}
						>
							{m["lessons.dictation.nextSentence"]()}
						</Button>
					) : null}
					<Button
						type="button"
						size="sm"
						className="btn btn-primary"
						onClick={onContinue}
					>
						{continueLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
