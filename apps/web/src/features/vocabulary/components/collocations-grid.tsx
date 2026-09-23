import type { Collocation } from "@engflex/contracts";

import { m } from "#/paraglide/messages";

export function CollocationsGrid({
	collocations,
}: {
	collocations: Collocation[];
}) {
	if (collocations.length === 0) return null;
	return (
		<section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<h2 className="text-sm font-bold tracking-tight text-foreground">
				{m["vocabulary.detail.collocationsTitle"]()}
			</h2>
			<div className="grid gap-3 md:grid-cols-2">
				{collocations.map((collocation) => (
					<div
						key={collocation.phrase}
						className="flex flex-col gap-1 rounded-lg border bg-background p-3"
					>
						<span className="text-sm font-semibold text-foreground">
							{collocation.phrase}
						</span>
						<span className="font-mono text-[11px] text-muted-foreground">
							{collocation.pattern}
						</span>
						<span className="text-xs text-muted-foreground">
							“{collocation.example}”
						</span>
					</div>
				))}
			</div>
		</section>
	);
}
