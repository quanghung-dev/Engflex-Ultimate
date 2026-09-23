import { useNavigate } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { VOICE_PARTNER_SCENARIO_IDS } from "#/features/dashboard/fixtures";
import { getScenario } from "#/features/voice/fixtures";
import { startSession } from "#/features/voice/store";
import { m } from "#/paraglide/messages";
import { ScenarioSelectorRow } from "./scenario-selector-row";

export function LiveVoicePartnerCard() {
	const navigate = useNavigate();
	const [selectedId, setSelectedId] = useState<string>(
		VOICE_PARTNER_SCENARIO_IDS[0],
	);
	const rows = VOICE_PARTNER_SCENARIO_IDS.map((id) => getScenario(id)).filter(
		(scenario) => scenario !== undefined,
	);

	return (
		<div className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-bold tracking-tight text-foreground">
						{m["dashboard.voicePartner.title"]()}
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{m["dashboard.voicePartner.description"]()}
					</p>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				{rows.map((scenario) => (
					<ScenarioSelectorRow
						key={scenario.id}
						title={scenario.title}
						status={
							selectedId === scenario.id
								? m["dashboard.voicePartner.selected"]()
								: m["dashboard.voicePartner.ready"]()
						}
						selected={selectedId === scenario.id}
						onSelect={() => setSelectedId(scenario.id)}
					/>
				))}
			</div>
			<Button
				className="mt-auto w-full"
				onClick={() => {
					startSession("free_talk");
					navigate({ to: "/voice/room" });
				}}
			>
				<Mic data-icon="inline-start" />
				{m["dashboard.voicePartner.start"]()}
			</Button>
		</div>
	);
}
