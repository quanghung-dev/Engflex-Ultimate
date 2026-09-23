import { m } from "#/paraglide/messages";

export function WritingPromptBanner({
	partNumber,
	partCount,
	title,
	minWords,
	maxWords,
	contextQuestions,
}: {
	partNumber: number;
	partCount: number;
	title: string;
	minWords: number;
	maxWords: number;
	contextQuestions: string[];
}) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
				{m["lessons.partOf"]({ number: partNumber, total: partCount })}
			</span>
			<h2 className="text-lg font-extrabold tracking-tight text-foreground">
				{m["lessons.writingPrompt"]({ title })}
			</h2>
			<p className="text-xs font-semibold text-primary">
				{m["lessons.writingTarget"]({ min: minWords, max: maxWords })}
			</p>
			<div className="flex flex-col gap-2">
				<span className="text-xs text-muted-foreground">
					{m["lessons.writingHint"]()}
				</span>
				<ul className="flex flex-col gap-1">
					{contextQuestions.map((question) => (
						<li
							key={question}
							className="flex items-start gap-2 text-sm text-foreground"
						>
							<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
							{question}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
