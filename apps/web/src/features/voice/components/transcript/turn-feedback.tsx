import type { TurnFeedback } from "@engflex/contracts";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SubmitButton } from "#/components/common/submit-button";
import { Button } from "#/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { TurnDiagnosticsCard } from "#/features/voice/components/transcript/turn-diagnostics-card";
import { m } from "#/paraglide/messages";

/** The analyze control a transcript panel needs per learner turn. The live
panels wire it to the analyze mutation; the DEV preview injects a noop so
the same container renders with fixtures and zero network. */
export type AnalyzeControl = {
	pending: boolean;
	failed: boolean;
	onAnalyze: (position: number) => void;
};

/** Analyze affordance and result for one learner turn. Pending and error
state come from the mutation, not local useState: a local flag would clear
the spinner before the async request resolves. The result opens as a
dialog (edit-modal pattern): it auto-opens when feedback first arrives and
reopens from the trigger. */
export function TurnFeedbackPanel({
	feedback,
	utterance,
	pending,
	failed,
	onAnalyze,
}: {
	feedback?: TurnFeedback;
	utterance: string;
	pending: boolean;
	failed: boolean;
	onAnalyze: () => void;
}) {
	const [open, setOpen] = useState(false);
	// Opens when feedback first arrives — including mount-with-data (reload,
	// seeded e2e) — and stays shut once dismissed until new feedback lands.
	const hadFeedback = useRef(false);
	useEffect(() => {
		if (feedback != null && !hadFeedback.current) {
			setOpen(true);
		}
		hadFeedback.current = feedback != null;
	}, [feedback]);

	if (feedback) {
		const label = m["voice.room.feedback.viewAnalysis"]();
		return (
			<>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							aria-label={label}
							onClick={() => setOpen(true)}
						>
							<Sparkles />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{label}</TooltipContent>
				</Tooltip>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
						<DialogTitle className="sr-only">
							{m["voice.room.feedback.title"]()}
						</DialogTitle>
						<TurnDiagnosticsCard
							feedback={feedback}
							utterance={utterance}
							pending={pending}
							onReanalyze={onAnalyze}
							framed={false}
						/>
					</DialogContent>
				</Dialog>
			</>
		);
	}
	return (
		<div className="flex flex-col items-start gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<SubmitButton
						type="button"
						variant="outline"
						size="icon-sm"
						pending={pending}
						aria-label={m["voice.room.transcript.analyze"]()}
						onClick={onAnalyze}
					>
						<Sparkles />
					</SubmitButton>
				</TooltipTrigger>
				<TooltipContent>
					{pending
						? m["voice.room.transcript.analyzing"]()
						: m["voice.room.transcript.analyze"]()}
				</TooltipContent>
			</Tooltip>
			{failed ? (
				<p className="text-xs text-destructive">
					{m["voice.room.transcript.analyzeFailed"]()}
				</p>
			) : null}
		</div>
	);
}
