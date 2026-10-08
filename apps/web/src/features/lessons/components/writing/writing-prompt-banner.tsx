import { m } from "#/paraglide/messages";

export function WritingPromptBanner({
	partNumber,
	partCount,
	task,
	instructions,
	stimulus,
	minWords,
	maxWords,
}: {
	partNumber: number;
	partCount: number;
	task: string;
	instructions: string;
	stimulus: string;
	minWords: number;
	maxWords: number;
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
				{m["lessons.writing.prompt"]({ title: task })}
			</h2>
			<p className="text-[15px] leading-[24px] font-medium text-foreground">
				{stimulus}
			</p>
			<div className="flex flex-col gap-2 rounded-[16px] border-2 border-border bg-accent p-3">
				<span className="text-xs font-bold text-muted-foreground">
					{m["lessons.writing.hint"]()}
				</span>
				<p className="text-[15px] font-medium text-foreground">
					{instructions}
				</p>
			</div>
		</div>
	);
}
