import type { Turn } from "@engflex/contracts";
import { Button } from "#/components/ui/button";
import { PersistedTranscript } from "#/features/voice/components/transcript/persisted-transcript";
import type { AnalyzeControl } from "#/features/voice/components/transcript/turn-feedback";
import { m } from "#/paraglide/messages";

/**
 * A finished conversation renders its persisted transcript (review state)
 * with per-turn Analyze — no live session, no modal, no redirect. The room
 * passes `conversationId` (query-backed); the DEV preview passes `turns`
 * fixtures instead.
 */
export function EndedReview({
	conversationId,
	turns,
	analyze,
	onBack,
}: {
	conversationId?: string;
	turns?: Turn[];
	analyze?: AnalyzeControl;
	onBack: () => void;
}) {
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
			<PersistedTranscript
				conversationId={conversationId}
				turns={turns}
				analyze={analyze}
			/>
			<Button type="button" variant="outline" onClick={onBack}>
				{m["voice.backToScenarios"]()}
			</Button>
		</div>
	);
}
