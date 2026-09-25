import type { ConversationMessage } from "@pipecat-ai/client-react";
import { PipecatAppBase } from "@pipecat-ai/voice-ui-kit";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb } from "#/app/breadcrumbs";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "#/components/ui/sheet";
import { SessionModal } from "#/features/voice/components/session-modal";
import { TranscriptPanel } from "#/features/voice/components/transcript-panel";
import { VoicePanel } from "#/features/voice/components/voice-panel";
import { VoiceRoomSkeleton } from "#/features/voice/components/voice-room-skeleton";
import { m } from "#/paraglide/messages";
import "@pipecat-ai/voice-ui-kit/styles.scoped.css";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/voice/preview")({
	staticData: breadcrumb([
		{ label: () => m["nav.voice"](), target: { to: APP_ROUTES.VOICE } },
		() => m["voice.roomCrumb"](),
		() => "preview",
	]),
	component: VoicePreviewPage,
});

const now = new Date().toISOString();

/** Fixture turns so the real panels can be tweaked without a session. */
const PREVIEW_MESSAGES: ConversationMessage[] = [
	{
		role: "assistant",
		parts: [
			{
				text: "Hi! What would you like to talk about today?",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "user",
		parts: [
			{
				text: "I want to practice talking about my last sprint review.",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "assistant",
		parts: [
			{
				text: "Great choice. How did the review go — what went well?",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "user",
		parts: [
			{
				text: "We shipped on time, but I struggled to explain the delay in the API migration.",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "assistant",
		parts: [
			{
				text: "That happens to everyone. How did you phrase it in the moment?",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "user",
		parts: [
			{
				text: "I said the migration was blocked because the endpoint was unstable, and the team kept asking for details I did not have.",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "assistant",
		parts: [
			{
				text: "Good instinct to name the blocker. Next time try framing the impact first, then the cause — want to rehearse that?",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "user",
		parts: [
			{
				text: "Sure. So I would say the release slipped by two days because the new endpoint failed under load, and we added retries as a guard.",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "assistant",
		parts: [
			{
				text: "Much clearer — impact, cause, fix in one breath. How confident did that feel on a scale of one to five?",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "user",
		parts: [
			{
				text: "Maybe a three. I always rush when executives ask follow-up questions.",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
	{
		role: "assistant",
		parts: [
			{
				text: "Then let's drill exactly that — I'll play the stakeholder and push back. Ready?",
				final: true,
				createdAt: now,
			},
		],
		createdAt: now,
	},
];

/**
 * DEV-only preview of the real room panels (VoicePanel + TranscriptPanel)
 * with fixture data — no conversation, no engine. Devices initialize on
 * mount so the local mic track exists for the "mic" waveform source.
 * Throws 404 in production builds; delete before P2 if no longer needed.
 */
function VoicePreviewPage() {
	if (!import.meta.env.DEV) throw notFound();

	return (
		<PipecatAppBase
			transportType="smallwebrtc"
			initDevicesOnMount
			noThemeProvider
		>
			{({ client }) => {
				// The kit renders children without PipecatClientProvider until
				// the client instance exists (async effect after mount), so the
				// panels — which consume the conversation context — only mount
				// once the provider is in place. Same guard as the real room.
				if (!client) return <VoiceRoomSkeleton />;
				return <PreviewPanels />;
			}}
		</PipecatAppBase>
	);
}

type WaveformSource = "bot" | "mic";

function PreviewPanels() {
	const [source, setSource] = useState<WaveformSource>("mic");
	const [ended, setEnded] = useState(false);
	return (
		<div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
			<div className="flex flex-wrap items-center gap-3">
				<p className="text-xs text-muted-foreground">
					DEV preview — fixture data, ending reopens on dismiss.
				</p>
				<fieldset className="flex gap-1">
					<legend className="sr-only">Waveform source</legend>
					{(["bot", "mic"] as const).map((option) => (
						<Button
							key={option}
							type="button"
							variant={source === option ? "default" : "outline"}
							size="sm"
							onClick={() => setSource(option)}
						>
							{option === "bot" ? "Bot track" : "Mic track"}
						</Button>
					))}
				</fieldset>
			</div>
			<div className="grid min-h-0 flex-1 items-stretch gap-4 lg:h-[calc(100dvh-5.5rem)] lg:flex-none lg:grid-cols-2">
				<VoicePanel
					title={m["voice.room.freeTalkTitle"]()}
					objective={m["voice.room.freeTalkObjective"]()}
					ending={false}
					onEnd={() => setEnded(true)}
					waveformSource={source}
				/>
				<TranscriptPanel
					className="hidden lg:flex"
					messages={PREVIEW_MESSAGES}
				/>
			</div>
			<div className="lg:hidden">
				<Sheet>
					<SheetTrigger asChild>
						<Button type="button" variant="outline">
							<MessageSquareText data-icon="inline-start" />
							{m["voice.room.transcriptTitle"]()}
						</Button>
					</SheetTrigger>
					<SheetContent side="bottom" className="max-h-[80vh]">
						<SheetHeader>
							<SheetTitle>{m["voice.room.transcriptTitle"]()}</SheetTitle>
							<SheetDescription>
								{m["voice.room.freeTalkObjective"]()}
							</SheetDescription>
						</SheetHeader>
						<div className="overflow-hidden px-4 pb-4">
							<TranscriptPanel messages={PREVIEW_MESSAGES} />
						</div>
					</SheetContent>
				</Sheet>
			</div>
			<SessionModal
				open={ended}
				title={m["voice.sessionEnded"]()}
				description={m["voice.sessionEnded"]()}
				actionLabel={m["voice.backToScenarios"]()}
				onAction={() => setEnded(false)}
			/>
		</div>
	);
}
