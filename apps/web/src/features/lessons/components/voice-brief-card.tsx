import type { Scenario } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Play } from "lucide-react";
import { CefrBadge } from "#/components/common/cefr-badge";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export function VoiceBriefCard({
	lessonId,
	scenario,
	onStart,
}: {
	lessonId: string;
	scenario: Scenario;
	onStart: () => void;
}) {
	const persona = scenario.persona;
	return (
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<div className="flex flex-wrap items-center gap-2">
				<CefrBadge value={scenario.cefrLevel} />
				{persona ? (
					<span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
						{m["voice.card.partner"]({ role: persona.roleTitle })}
					</span>
				) : null}
				<span className="text-[11px] text-muted-foreground">
					{m["voice.card.sessionRange"]({
						min: scenario.durationMin,
						max: scenario.durationMax,
					})}
				</span>
			</div>
			<h2 className="text-lg font-extrabold tracking-tight text-foreground">
				{scenario.title}
			</h2>
			<p className="text-sm text-muted-foreground">{scenario.objective}</p>
			<ul className="flex flex-col gap-1 text-xs text-muted-foreground">
				<li>{m["voice.room.briefTip1"]()}</li>
				<li>{m["voice.room.briefTip2"]()}</li>
			</ul>
			<div className="flex flex-wrap gap-3">
				<Button type="button" onClick={onStart}>
					<Play data-icon="inline-start" />
					{m["voice.card.start"]()}
				</Button>
				<Button asChild variant="outline">
					<Link to="/lessons/$lessonId" params={{ lessonId }}>
						<ArrowLeft data-icon="inline-start" />
						{m["lessons.backToLesson"]()}
					</Link>
				</Button>
			</div>
		</div>
	);
}
