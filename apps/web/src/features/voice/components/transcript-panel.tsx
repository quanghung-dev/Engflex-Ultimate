import type {
	ConversationMessage,
	ConversationMessagePart,
} from "@pipecat-ai/client-react";
import { usePipecatConversation } from "@pipecat-ai/client-react";
import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { ScrollArea } from "#/components/ui/scroll-area";
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
}: {
	className?: string;
	messages?: ConversationMessage[];
}) {
	const live = usePipecatConversation();
	const messages = messagesOverride ?? live.messages;
	const bottomRef = useRef<HTMLDivElement>(null);

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

	const rowCount = rows.length;
	useEffect(() => {
		if (rowCount === 0) return;
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [rowCount]);

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
						<ul className="flex flex-col gap-4">
							{rows.map(({ message, index, text }) => {
								const isUser = message.role === "user";
								return (
									<li
										key={`${message.createdAt}-${index}`}
										className={cn(
											"flex min-w-0 gap-2",
											isUser ? "flex-row-reverse" : "flex-row",
										)}
									>
										<Avatar size="sm">
											<AvatarFallback>
												{isUser
													? m["voice.room.speakerYou"]().slice(0, 1)
													: m["voice.room.partnerFallback"]().slice(0, 1)}
											</AvatarFallback>
										</Avatar>
										<div
											className={cn(
												"flex min-w-0 max-w-[85%] flex-col gap-1",
												isUser ? "items-end" : "items-start",
											)}
										>
											<span className="text-[11px] font-medium text-muted-foreground">
												{isUser
													? m["voice.room.speakerYou"]()
													: m["voice.room.partnerFallback"]()}
											</span>
											<p
												className={cn(
													"rounded-xl px-3 py-2 text-sm break-words",
													isUser
														? "bg-primary text-primary-foreground"
														: "bg-muted text-foreground",
												)}
											>
												{text}
											</p>
										</div>
									</li>
								);
							})}
						</ul>
					)}
					<div ref={bottomRef} />
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
