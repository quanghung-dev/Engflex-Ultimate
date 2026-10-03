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
		<div className="surface-card flex h-full flex-col gap-3 p-5">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="chip bg-accent px-2 py-0.5 text-[11px] font-bold">
					{m["lessons.detail.partOf"]({ number: partNumber, total: partCount })}
				</span>
				<span className="text-xs font-bold text-primary">
					{m["lessons.writing.target"]({ min: minWords, max: maxWords })}
				</span>
			</div>
			<h2 className="text-xl font-bold text-foreground">
				{m["lessons.writing.prompt"]({ title })}
			</h2>
			<div className="flex flex-col gap-2 rounded-[16px] border-2 border-border bg-accent p-3">
				<span className="text-xs font-bold text-muted-foreground">
					{m["lessons.writing.hint"]()}
				</span>
				<ul className="flex flex-col gap-1.5">
					{contextQuestions.map((question) => (
						<li
							key={question}
							className="flex items-start gap-2 text-[15px] font-medium text-foreground"
						>
							<span
								aria-hidden="true"
								className="mt-[9px] size-1.5 shrink-0 rounded-full bg-primary"
							/>
							{question}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
