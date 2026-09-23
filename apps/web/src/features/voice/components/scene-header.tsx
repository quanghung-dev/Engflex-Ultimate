import type { Scenario } from "@engflex/contracts";
import { Clock3 } from "lucide-react";
import { CefrBadge } from "#/components/common/cefr-badge";
import { m } from "#/paraglide/messages";

const FALLBACK = {
	title: () => m["voice.room.freeTalkTitle"](),
	objective: () => m["voice.room.freeTalkObjective"](),
};

export function SceneHeader({ scenario }: { scenario: Scenario | undefined }) {
	const title = scenario?.title ?? FALLBACK.title();
	const objective = scenario?.objective ?? FALLBACK.objective();

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-2">
				{scenario?.persona ? (
					<span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
						{m["voice.card.partner"]({ role: scenario.persona.roleTitle })}
					</span>
				) : null}
				{scenario ? <CefrBadge value={scenario.cefrLevel} /> : null}
				<span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
					<Clock3 className="size-3" />
					{scenario
						? m["voice.room.defenseRange"]({
								min: scenario.durationMin,
								max: scenario.durationMax,
							})
						: m["voice.room.freeTalkFixed"]()}
				</span>
			</div>
			<h2 className="text-base font-bold tracking-tight text-foreground">
				{title}
			</h2>
			<p className="text-xs text-muted-foreground">{objective}</p>
		</div>
	);
}
