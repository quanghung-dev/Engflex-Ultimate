import { CircleCheck } from "lucide-react";
import { m } from "#/paraglide/messages";

export function OutcomesCard({ outcomes }: { outcomes: string[] }) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<h2 className="text-sm font-bold tracking-tight text-foreground">
				{m["lessons.outcomesTitle"]()}
			</h2>
			<ul className="flex flex-col gap-2">
				{outcomes.map((outcome) => (
					<li
						key={outcome}
						className="flex gap-2 text-sm text-muted-foreground"
					>
						<CircleCheck className="mt-0.5 size-4 shrink-0 text-accuracy" />
						<span>{outcome}</span>
					</li>
				))}
			</ul>
		</div>
	);
}
