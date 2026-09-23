import type { WordForm } from "@engflex/contracts";

import { m } from "#/paraglide/messages";

export function MorphologyCard({
	wordForms,
	etymology,
}: {
	wordForms: WordForm[];
	etymology: string;
}) {
	return (
		<section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<h2 className="text-sm font-bold tracking-tight text-foreground">
				{m["vocabulary.detail.morphologyTitle"]()}
			</h2>
			<dl className="flex flex-col gap-2">
				{wordForms.map((form) => (
					<div
						key={form.formType}
						className="flex items-baseline justify-between gap-3"
					>
						<dt className="text-xs font-semibold text-muted-foreground">
							{form.formType}
						</dt>
						<dd className="text-xs text-foreground">{form.forms.join(", ")}</dd>
					</div>
				))}
			</dl>
			<div className="flex flex-col gap-1 border-t pt-3">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{m["vocabulary.detail.origin"]()}
				</span>
				<p className="text-xs text-muted-foreground">{etymology}</p>
			</div>
		</section>
	);
}
