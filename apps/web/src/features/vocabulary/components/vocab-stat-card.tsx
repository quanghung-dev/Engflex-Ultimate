import type { LucideIcon } from "lucide-react";
import { ProgressBar } from "#/components/common/progress-bar";
import { StatCard } from "#/components/common/stat-card";

export function VocabStatCard({
	label,
	value,
	sub,
	icon,
	retentionPct,
	tone = "primary",
}: {
	label: string;
	value: string | number;
	sub: string;
	icon: LucideIcon;
	retentionPct?: number;
	tone?: "primary" | "accuracy" | "violet";
}) {
	return (
		<StatCard
			label={label}
			value={value}
			icon={icon}
			tone={tone}
			footer={
				<span className="flex flex-col gap-1">
					<span>{sub}</span>
					{typeof retentionPct === "number" ? (
						<ProgressBar value={retentionPct} tone="accuracy" />
					) : null}
				</span>
			}
		/>
	);
}
