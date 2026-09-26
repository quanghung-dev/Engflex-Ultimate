import type {
	ConversationMessage,
	ConversationMessagePart,
} from "@pipecat-ai/client-react";
import { usePipecatConversation } from "@pipecat-ai/client-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ScrollArea } from "#/components/ui/scroll-area";
import { TurnFeedbackPanel } from "#/features/voice/components/turn-feedback";
import { useAnalyzeTurn, useConversation } from "#/features/voice/queries";
import { cn } from "#/lib/utils";
import { m } from "#/paraglide/messages";

/** Plain-text extraction for a pipecat message part (sona parity). */
function getPartText(part: ConversationMessagePart): string {
	const text = part.text;
	if (typeof text === "string") return text;
	if (
		text !== null &&
		typeof text === "object" &&
		"spoken" in text &&
		"unspoken" in text
	) {
		const value = text as { spoken: string; unspoken: string };
		return [value.spoken, value.unspoken].filter(Boolean).join(" ");
	}
	return "";
}

function getMessageText(message: ConversationMessage): string {
	return (
		message.parts
			?.map(getPartText)
			.filter(Boolean)
			.join(" ")
			.replace(/\s+/g, " ")
			.trim() ?? ""
	);
}

export type TranscriptRow = {
	key: string;
	isUser: boolean;
	text: string;
	accessory?: ReactNode;
};

/** Shared bubble list: the live panel and the persisted review render rows
identically; only the accessory below a bubble differs. */
export function TranscriptRows({ rows }: { rows: TranscriptRow[] }) {
	return (
		<ul className="flex flex-col gap-4">
			{rows.map((row) => (
				<li
					key={row.key}
					className={cn(
						"flex min-w-0 gap-2",
						row.isUser ? "flex-row-reverse" : "flex-row",
					)}
				>
					<Avatar size="sm">
						<AvatarFallback>
							{row.isUser
								? m["voice.room.speakerYou"]().slice(0, 1)
								: m["voice.room.partnerFallback"]().slice(0, 1)}
						</AvatarFallback>
					</Avatar>
					<div
						className={cn(
							"flex min-w-0 max-w-[85%] flex-col gap-1",
							row.isUser ? "items-end" : "items-start",
						)}
					>
						<span className="text-[11px] font-medium text-muted-foreground">
							{row.isUser
								? m["voice.room.speakerYou"]()
								: m["voice.room.partnerFallback"]()}
						</span>
						<p
							className={cn(
								"rounded-xl px-3 py-2 text-sm break-words",
								row.isUser
									? "bg-primary text-primary-foreground"
									: "bg-muted text-foreground",
							)}
						>
							{row.text}
						</p>
						{row.accessory}
					</div>
				</li>
			))}
		</ul>
	);
}

/**
 * Right half of the dual-panel room (sona HistoryPanelContent equivalent):
 * live transcript as avatar + bubble rows inside a Card + ScrollArea.
 * Grammar analysis actions are P2 — this panel is transcript-only.
 *
 * `messages` overrides the live conversation: the dev-only preview route
 * passes fixture turns so the layout can be tweaked without a real session.
 */
export function TranscriptPanel({
	className,
	messages: messagesOverride,
	conversationId,
}: {
	className?: string;
	messages?: ConversationMessage[];
	conversationId?: string;
}) {
	const live = usePipecatConversation();
	const messages = messagesOverride ?? live.messages;
	const bottomRef = useRef<HTMLDivElement>(null);

	// Live persisted turns, polled while a session is running. Positions are
	// assigned by finalize order on both sides, so group ordinal == position.
	const persisted = useConversation(conversationId ?? "", {
		refetchInterval: conversationId ? 2000 : undefined,
	});
	const analyze = useAnalyzeTurn(conversationId ?? "");
	const persistedByPosition = new Map(
		(persisted.data?.turns ?? []).map((turn) => [turn.position, turn]),
	);

	const rows = messages
		.map((message, index) => ({
			message,
			index,
			text: getMessageText(message),
		}))
		.filter(
			(row) =>
				(row.message.role === "user" || row.message.role === "assistant") &&
				row.text.length > 0,
		);

	// Collapse consecutive same-role messages exactly like the engine
	// collector does, so group ordinal aligns with persisted positions.
	type Group = { key: string; isUser: boolean; text: string };
	const groups: Group[] = [];
	let prevRole: string | null = null;
	for (const row of rows) {
		const isUser = row.message.role === "user";
		const last = groups[groups.length - 1];
		if (last && prevRole === row.message.role) {
			last.text = `${last.text} ${row.text}`.trim();
		} else {
			groups.push({
				key: `${row.message.createdAt}-${row.index}`,
				isUser,
				text: row.text,
			});
		}
		prevRole = row.message.role;
	}

	const rowCount = groups.length;
	useEffect(() => {
		if (rowCount === 0) return;
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [rowCount]);

	return (
		<Card className={cn("flex h-full min-h-0 flex-col", className)}>
			<CardHeader className="pb-0">
				<CardTitle className="flex items-center gap-2 text-base">
					{m["voice.room.transcriptTitle"]()}
					<Badge variant="secondary">{groups.length}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="min-h-0 flex-1 pb-6">
				<ScrollArea className="h-full max-h-[55vh] min-h-0 overflow-x-clip pr-3 lg:max-h-none">
					{groups.length === 0 ? (
						<p className="py-8 text-center text-sm text-muted-foreground">
							{m["voice.room.transcriptEmpty"]()}
						</p>
					) : (
						<TranscriptRows
							rows={groups.map((group, groupIndex) => {
								// Global position: group ordinal, aligned with the
								// persisted turns. The Analyze button appears only
								// once the row exists server-side, so a transient
								// mismatch can delay it but never misattach feedback.
								const position = groupIndex + 1;
								const persistedTurn = persistedByPosition.get(position);
								const showAnalyze = group.isUser && persistedTurn !== undefined;
								return {
									key: group.key,
									isUser: group.isUser,
									text: group.text,
									accessory: showAnalyze ? (
										<TurnFeedbackPanel
											feedback={persistedTurn.feedback ?? undefined}
											pending={analyze.isPending}
											failed={analyze.isError}
											onAnalyze={() => analyze.mutate(position)}
										/>
									) : undefined,
								};
							})}
						/>
					)}
					<div ref={bottomRef} />
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
