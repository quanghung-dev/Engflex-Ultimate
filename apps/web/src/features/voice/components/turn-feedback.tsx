import type { TurnFeedback } from "@engflex/contracts";
import { Sparkles } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { TurnDiagnosticsCard } from "#/features/voice/components/turn-diagnostics-card";
import { m } from "#/paraglide/messages";

/** Analyze affordance and result for one learner turn. Pending and error
state come from the mutation, not local useState: a local flag would clear
the spinner before the async request resolves. */
export function TurnFeedbackPanel({
	feedback,
	pending,
	failed,
	onAnalyze,
}: {
	feedback?: TurnFeedback;
	pending: boolean;
	failed: boolean;
	onAnalyze: () => void;
}) {
	if (feedback) {
		return (
			<TurnDiagnosticsCard
				feedback={feedback}
				pending={pending}
				onReanalyze={onAnalyze}
			/>
		);
	}
	return (
		<div className="flex flex-col items-start gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={pending}
						onClick={onAnalyze}
					>
						<Sparkles data-icon="inline-start" />
						{pending ? m["voice.room.analyzing"]() : m["voice.room.analyze"]()}
					</Button>
				</TooltipTrigger>
				<TooltipContent>{m["voice.room.analyze"]()}</TooltipContent>
			</Tooltip>
			{failed ? (
				<p className="text-xs text-destructive">
					{m["voice.room.analyzeFailed"]()}
				</p>
			) : null}
		</div>
	);
}
