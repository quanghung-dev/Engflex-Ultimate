import { m } from "#/paraglide/messages";

export function PassagePanel({
	kicker,
	title,
	passage,
}: {
	kicker: string;
	title: string;
	passage: string;
}) {
	const paragraphs = passage
		.split(/\n{2,}/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);

	return (
		<article className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{kicker}
				</span>
				<span className="text-[11px] text-muted-foreground">
					{m["lessons.passageReadTime"]()}
				</span>
			</div>
			<h2 className="text-lg font-extrabold tracking-tight text-foreground">
				{title}
			</h2>
			<div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
				{paragraphs.map((paragraph) => (
					<p key={paragraph.slice(0, 40)}>{paragraph}</p>
				))}
			</div>
		</article>
	);
}
