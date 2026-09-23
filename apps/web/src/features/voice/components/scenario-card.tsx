import type { Scenario } from "@engflex/contracts";
import { ArrowRight, Clock3 } from "lucide-react";
import { CefrBadge } from "#/components/common/cefr-badge";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export function ScenarioCard({
	scenario,
	onStart,
}: {
	scenario: Scenario;
	onStart: () => void;
}) {
	return (
		<div className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4">
			<div className="flex flex-wrap items-center gap-2">
				{scenario.persona ? (
					<span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
						{m["voice.card.partner"]({ role: scenario.persona.roleTitle })}
					</span>
				) : (
					<span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
						{m["voice.card.customTag"]()}
					</span>
				)}
				<CefrBadge value={scenario.cefrLevel} />
			</div>
			<h3 className="text-sm font-bold tracking-tight text-foreground">
				{scenario.title}
			</h3>
			<p className="text-xs text-muted-foreground">{scenario.objective}</p>
			<div className="mt-auto flex items-center justify-between gap-2">
				<span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
					<Clock3 className="size-3" />
					{m["voice.card.sessionRange"]({
						min: scenario.durationMin,
						max: scenario.durationMax,
					})}
				</span>
				<Button type="button" variant="ghost" size="sm" onClick={onStart}>
					{m["voice.card.start"]()}
					<ArrowRight data-icon="inline-end" />
				</Button>
			</div>
		</div>
	);
}
