import type { Turn } from "@engflex/contracts";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	type TranscriptRow,
	TranscriptRows,
} from "#/features/voice/components/transcript/transcript-panel";
import type { AnalyzeControl } from "#/features/voice/components/transcript/turn-feedback";
import { TurnFeedbackPanel } from "#/features/voice/components/transcript/turn-feedback";
import { REVIEW_MOCK_TURNS } from "#/features/voice/fixtures";
import { useAnalyzeTurn, useConversation } from "#/features/voice/queries";
import { cn } from "#/lib/utils";
import { m } from "#/paraglide/messages";

/**
 * Finished-session review view: pure rendering over resolved turns. No
 * network, no provider — the container below injects the data, whether live
 * or fixtures. Tweak bubble/feedback layout here.
 */
function PersistedTranscriptView({
	turns,
	analyzePending,
	analyzeFailed,
	onAnalyze,
	className,
}: {
	turns: Turn[];
	analyzePending: boolean;
	analyzeFailed: boolean;
	onAnalyze: (position: number) => void;
	className?: string;
}) {
	const rows: TranscriptRow[] = turns.map((turn) => ({
		key: turn.id,
		isUser: turn.role === "user",
		text: turn.text,
		accessory:
			turn.role === "user" ? (
				<TurnFeedbackPanel
					feedback={turn.feedback ?? undefined}
					utterance={turn.text}
					pending={analyzePending}
					failed={analyzeFailed}
					onAnalyze={() => onAnalyze(turn.position)}
				/>
			) : undefined,
	}));

	return (
		<Card className={cn("flex h-full min-h-0 flex-col", className)}>
			<CardHeader className="pb-0">
				<CardTitle className="flex items-center gap-2 text-base">
					{m["voice.room.transcriptTitle"]()}
					<Badge variant="secondary">{rows.length}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="min-h-0 flex-1 pb-6">
				<ScrollArea className="h-full max-h-[55vh] min-h-0 overflow-x-clip pr-3 lg:max-h-none">
					{rows.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							{m["voice.room.transcriptEmpty"]()}
						</p>
					) : (
						<TranscriptRows rows={rows} />
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}

/**
 * Finished-session review: one component for the room and the DEV preview.
 * TanStack hooks only — no Pipecat provider needed, so it mounts outside
 * PipecatAppBase. The room passes `conversationId`; the preview passes
 * `turns` fixtures (fetch skipped) plus a noop analyze control.
 */
export function PersistedTranscript({
	conversationId,
	turns: turnsOverride,
	analyze: analyzeOverride,
	className,
}: {
	conversationId?: string;
	turns?: Turn[];
	analyze?: AnalyzeControl;
	className?: string;
}) {
	const useFixtures = turnsOverride !== undefined;
	const conversation = useConversation(conversationId ?? "", {
		enabled: !useFixtures,
	});
	const analyzeLive = useAnalyzeTurn(conversationId ?? "");
	const stored = turnsOverride ?? conversation.data?.turns ?? [];
	// Mock review while no real turns flow end to end (e.g. empty session).
	const turns = stored.length > 0 ? stored : REVIEW_MOCK_TURNS;

	return (
		<PersistedTranscriptView
			turns={turns}
			analyzePending={analyzeOverride?.pending ?? analyzeLive.isPending}
			analyzeFailed={analyzeOverride?.failed ?? analyzeLive.isError}
			onAnalyze={
				analyzeOverride?.onAnalyze ??
				((position) => analyzeLive.mutate(position))
			}
			className={className}
		/>
	);
}
