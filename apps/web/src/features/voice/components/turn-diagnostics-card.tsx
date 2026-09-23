import type { TurnFeedback, WordMarkStatus } from "@engflex/contracts";
import { cn } from "cn";
import { Lightbulb } from "lucide-react";
import { m } from "#/paraglide/messages";

const MARK_TONE: Record<WordMarkStatus, string> = {
	accurate: "border-accuracy",
	warning: "border-warning",
	error: "border-ai-coral",
};

export function TurnDiagnosticsCard({ feedback }: { feedback: TurnFeedback }) {
	return (
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
			<div className="flex flex-col gap-2">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{m["voice.room.annotated"]()}
				</span>
				<p className="flex flex-wrap gap-x-1.5 gap-y-1 text-sm">
					{feedback.marks.map((mark) => (
						<span
							key={mark.word}
							className={cn(
								"border-b-2 pb-0.5 text-foreground",
								MARK_TONE[mark.status],
							)}
						>
							{mark.word}
						</span>
					))}
				</p>
			</div>

			<div className="grid gap-2 md:grid-cols-2">
				{feedback.phonemes.map((phoneme) => (
					<div
						key={`${phoneme.ipa}-${phoneme.word}`}
						className="flex items-center gap-3 rounded-lg border bg-background p-2.5"
					>
						<span className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs text-foreground">
							{phoneme.ipa}
						</span>
						<div className="flex min-w-0 flex-col">
							<span className="truncate text-xs text-muted-foreground">
								{m["voice.room.inWord"]({ word: phoneme.word })}
							</span>
							<span
								className={cn(
									"text-xs font-semibold",
									phoneme.accuracyPct >= 85 ? "text-accuracy" : "text-ai-coral",
								)}
							>
								{phoneme.accuracyPct}% · {phoneme.label}
							</span>
						</div>
					</div>
				))}
			</div>

			{feedback.upgrades.map((upgrade) => (
				<div
					key={upgrade.original}
					className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2.5 text-xs"
				>
					<span className="text-muted-foreground line-through">
						{upgrade.original}
					</span>
					<span className="font-semibold text-primary">
						{upgrade.replacements.join(" / ")}
					</span>
					<span className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
						{upgrade.category}
					</span>
				</div>
			))}

			<div className="flex items-start gap-2">
				<Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-violet" />
				<p className="text-xs text-muted-foreground">{feedback.tip}</p>
			</div>
		</div>
	);
}
