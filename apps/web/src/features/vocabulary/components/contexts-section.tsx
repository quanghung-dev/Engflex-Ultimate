import type { VocabularyContext } from "@engflex/contracts";

/** Wraps the first case-insensitive occurrence of `term` in a highlight span. */
function highlightTerm(text: string, term: string) {
	const index = text.toLowerCase().indexOf(term.toLowerCase());
	if (index < 0) return text;
	return (
		<>
			{text.slice(0, index)}
			<mark className="bg-transparent font-semibold text-primary">
				{text.slice(index, index + term.length)}
			</mark>
			{text.slice(index + term.length)}
		</>
	);
}

import { m } from "#/paraglide/messages";

export function ContextsSection({
	term,
	contexts,
}: {
	term: string;
	contexts: VocabularyContext[];
}) {
	if (contexts.length === 0) return null;
	return (
		<section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<h2 className="text-sm font-bold tracking-tight text-foreground">
				{m["vocabulary.detail.contextsTitle"]()}
			</h2>
			<ul className="flex flex-col gap-4">
				{contexts.map((context) => (
					<li key={context.label} className="flex flex-col gap-1">
						<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
							{context.label}
						</span>
						<blockquote className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">
							“{highlightTerm(context.quote, term)}”
						</blockquote>
					</li>
				))}
			</ul>
		</section>
	);
}
