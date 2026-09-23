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
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<div className="flex items-center gap-2">
				<CircleCheck className="size-4 text-accuracy" />
				<span className="text-sm font-bold text-foreground">
					{m["lessons.sentenceCompleted"]()}
				</span>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs font-semibold text-muted-foreground">
					{m["lessons.typedLabel"]()}
				</span>
				<p className="text-sm">
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
				<span className="text-xs font-semibold text-muted-foreground">
					{m["lessons.referenceLabel"]()}
				</span>
				<p className="text-sm text-muted-foreground">“{reference}”</p>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
				<span className="text-xs text-muted-foreground">
					{m["lessons.remaining"]({ count: remaining })}
				</span>
				<div className="flex items-center gap-2">
					{onNext ? (
						<Button type="button" variant="outline" size="sm" onClick={onNext}>
							{m["common.nextSentence"]()}
						</Button>
					) : null}
					<Button type="button" size="sm" onClick={onContinue}>
						{continueLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
