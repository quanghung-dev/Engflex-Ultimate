import { AudioWaveform } from "lucide-react";
import { ProgressBar } from "#/components/common/progress-bar";
import { m } from "#/paraglide/messages";

export function AcousticTargetCard({
	targetPct,
	completionPct,
	cefrLevel,
}: {
	targetPct: number;
	completionPct: number;
	cefrLevel: string;
}) {
	return (
		<div className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4">
			<div className="flex items-center gap-2">
				<span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
					<AudioWaveform className="size-4" />
				</span>
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{m["lessons.acousticTitle"]()}
				</span>
			</div>
			<span className="text-2xl font-extrabold tracking-tight text-foreground">
				{targetPct}%+
			</span>
			<p className="text-xs text-muted-foreground">
				{m["lessons.acousticBody"]({ level: cefrLevel })}
			</p>
			<div className="mt-auto flex flex-col gap-2">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{m["lessons.completionNow"]()}
				</span>
				<ProgressBar value={completionPct} />
			</div>
		</div>
	);
}
