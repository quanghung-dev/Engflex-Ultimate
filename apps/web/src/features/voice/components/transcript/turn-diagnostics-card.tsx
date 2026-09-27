import type { TurnFeedback, WordMarkStatus } from "@engflex/contracts";
import { cn } from "cn";
import { Lightbulb, Sparkles } from "lucide-react";
import { SubmitButton } from "#/components/common/submit-button";
import { m } from "#/paraglide/messages";

const MARK_TONE: Record<WordMarkStatus, string> = {
	accurate: "border-accuracy",
	warning: "border-warning",
	error: "border-ai-coral",
};

export function TurnDiagnosticsCard({
	feedback,
	onReanalyze,
	pending,
}: {
	feedback: TurnFeedback;
	onReanalyze: () => void;
	pending: boolean;
}) {
	return (
		<div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
			<div className="flex items-center justify-between gap-2">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{m["voice.room.annotated"]()}
				</span>
				<SubmitButton
					type="button"
					variant="ghost"
					size="sm"
					pending={pending}
					loadingLabel={m["voice.room.analyzing"]()}
					onClick={onReanalyze}
				>
					<Sparkles data-icon="inline-start" />
					{m["voice.room.reanalyze"]()}
				</SubmitButton>
			</div>
			<div className="flex flex-col gap-2">
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
