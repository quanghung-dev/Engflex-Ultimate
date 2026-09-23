import { TriangleAlert } from "lucide-react";

import { m } from "#/paraglide/messages";

export function AcousticBreakdownCard({
	syllables,
	stressTip,
	commonSlip,
}: {
	syllables: string;
	stressTip: string;
	commonSlip: string;
}) {
	return (
		<section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<h2 className="text-sm font-bold tracking-tight text-foreground">
				{m["vocabulary.detail.acousticTitle"]()}
			</h2>
			<div className="flex flex-wrap items-center gap-2 text-xs">
				<span className="font-semibold text-muted-foreground">
					{m["vocabulary.detail.syllables"]()}
				</span>
				<span className="font-mono text-foreground">{syllables}</span>
			</div>
			<div className="flex items-start gap-2">
				<span className="rounded-md border border-accuracy/30 bg-accuracy-tint px-1.5 py-0.5 text-[11px] font-semibold text-accuracy">
					{m["vocabulary.detail.stressTip"]()}
				</span>
				<p className="text-xs text-muted-foreground">{stressTip}</p>
			</div>
			<div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-muted p-3">
				<TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
				<p className="text-xs text-muted-foreground">
					<span className="font-semibold text-foreground">
						{m["vocabulary.detail.commonSlip"]()}
					</span>
					{commonSlip}
				</p>
			</div>
		</section>
	);
}
