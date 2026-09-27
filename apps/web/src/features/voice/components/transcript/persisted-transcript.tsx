import type { Turn } from "@engflex/contracts";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ScrollArea } from "#/components/ui/scroll-area";
import {
	type TranscriptRow,
	TranscriptRows,
} from "#/features/voice/components/transcript/transcript-panel";
import { TurnFeedbackPanel } from "#/features/voice/components/transcript/turn-feedback";
import { REVIEW_MOCK_TURNS } from "#/features/voice/fixtures";
import { useAnalyzeTurn, useConversation } from "#/features/voice/queries";
import { cn } from "#/lib/utils";
import { m } from "#/paraglide/messages";

/**
 * Finished-session review: the persisted transcript with per-turn Analyze.
 * TanStack hooks only — no Pipecat provider needed, so it mounts outside
 * PipecatAppBase. Optional `turns` override feeds the DEV preview fixtures.
 */
export function PersistedTranscript({
	conversationId,
	turns: turnsOverride,
	className,
}: {
	conversationId: string;
	turns?: Turn[];
	className?: string;
}) {
	const conversation = useConversation(conversationId);
	const analyze = useAnalyzeTurn(conversationId);
	const stored = turnsOverride ?? conversation.data?.turns ?? [];
	// Mock review while no real turns flow end to end (e.g. empty session).
	const turns = stored.length > 0 ? stored : REVIEW_MOCK_TURNS;

	const rows: TranscriptRow[] = turns.map((turn) => ({
		key: turn.id,
		isUser: turn.role === "user",
		text: turn.text,
		accessory:
			turn.role === "user" ? (
				<TurnFeedbackPanel
					feedback={turn.feedback ?? undefined}
					pending={analyze.isPending}
					failed={analyze.isError}
					onAnalyze={() => analyze.mutate(turn.position)}
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
