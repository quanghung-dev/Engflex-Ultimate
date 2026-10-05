import type { Scenario } from "@engflex/contracts";
import { m } from "#/paraglide/messages";

/** Situation context, role metrics, opening line, and response strategy. */
export function ScenarioDetailBody({ scenario }: { scenario: Scenario }) {
	const metrics = [
		...(scenario.details.role
			? [
					{
						label: m["voice.detail.context.role"](),
						value: scenario.details.role,
					},
				]
			: []),
		...(scenario.details.interlocutorRole
			? [
					{
						label: m["voice.detail.context.interlocutor"](),
						value: scenario.details.interlocutorRole,
					},
				]
			: []),
		...(scenario.details.goalFormat
			? [
					{
						label: m["voice.detail.context.goal"](),
						value: scenario.details.goalFormat,
					},
				]
			: []),
	];
	return (
		<div className="flex flex-col gap-6">
			{scenario.details.context && scenario.details.context.length > 0 ? (
				<section className="surface-card flex flex-col gap-3 p-5">
					<h2 className="text-lg font-bold text-foreground">
						{m["voice.detail.context.title"]()}
					</h2>
					{scenario.details.context.map((paragraph) => (
						<p
							key={paragraph.slice(0, 32)}
							className="text-sm leading-relaxed text-muted-foreground"
						>
							{paragraph}
						</p>
					))}
					{metrics.length > 0 ? (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							{metrics.map((metric) => (
								<div
									key={metric.label}
									className="flex flex-col gap-0.5 rounded-xl border bg-card p-3"
								>
									<span className="text-[11px] font-medium text-muted-foreground">
										{metric.label}
									</span>
									<span className="text-sm font-bold text-foreground">
										{metric.value}
									</span>
								</div>
							))}
						</div>
					) : null}
				</section>
			) : null}

			{scenario.details.opening?.text ? (
				<section className="surface-card flex flex-col gap-3 p-5">
					<h2 className="text-lg font-bold text-foreground">
						{m["voice.detail.opening.title"]()}
					</h2>
					<div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
						{scenario.details.opening.label ? (
							<span className="text-sm font-bold text-foreground">
								{scenario.details.opening.label}
							</span>
						) : null}
						<p className="text-[15px] font-medium text-muted-foreground">
							“{scenario.details.opening.text}”
						</p>
					</div>
				</section>
			) : null}
		</div>
	);
}
