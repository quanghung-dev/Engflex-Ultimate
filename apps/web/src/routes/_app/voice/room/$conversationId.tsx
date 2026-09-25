import {
	type ConversationSession,
	ConversationStatusPending,
} from "@engflex/contracts";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import { PipecatAppBase } from "@pipecat-ai/voice-ui-kit";
import { API_ROUTES } from "#/app/api-routes";
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
import { useConversation, useEndConversation } from "#/features/voice/queries";
import { API_URL } from "#/lib/api";
import { authToken } from "#/lib/auth-token";
import { m } from "#/paraglide/messages";
import "@pipecat-ai/voice-ui-kit/styles.scoped.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MessageSquareText } from "lucide-react";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/_app/voice/room/$conversationId")({
	staticData: breadcrumb([
		{ label: () => m["nav.voice"](), target: { to: APP_ROUTES.VOICE } },
		() => m["voice.roomCrumb"](),
	]),
	component: VoiceRoomPage,
});

function VoiceRoomPage() {
	const { conversationId } = Route.useParams();
	const navigate = useNavigate();
	const conversation = useConversation(conversationId);
	const endConversation = useEndConversation(conversationId);
	const [mounted, setMounted] = useState(false);
	const [authHeaders, setAuthHeaders] = useState<Headers | null>(null);
	const [connectionLost, setConnectionLost] = useState(false);
	const [errorDetail, setErrorDetail] = useState<string | null>(null);
	const userDisconnecting = useRef(false);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		let cancelled = false;
		void authToken().then((token) => {
			if (cancelled) return;
			const headers = new Headers();
			if (token) headers.set("Authorization", `Bearer ${token}`);
			setAuthHeaders(headers);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		function beforeUnload(event: BeforeUnloadEvent) {
			event.preventDefault();
			event.returnValue = "";
		}
		window.addEventListener("beforeunload", beforeUnload);
		return () => window.removeEventListener("beforeunload", beforeUnload);
	}, []);

	if (!mounted || !authHeaders) {
		return <VoiceRoomSkeleton />;
	}

	const startBotParams = {
		endpoint: `${API_URL}${API_ROUTES.CONVERSATIONS.START(conversationId)}`,
		headers: authHeaders,
	};

	function transformStartResponse(response: unknown) {
		const data = (response as { data?: ConversationSession } | null | undefined)
			?.data;
		return {
			webrtcRequestParams: {
				endpoint: `${API_URL}${API_ROUTES.CONVERSATIONS.OFFER(conversationId)}`,
				headers: authHeaders,
			},
			iceConfig: data?.iceConfig
				? {
						iceServers: data.iceConfig.iceServers.map((server) => ({
							urls: server.urls,
							...(server.username ? { username: server.username } : {}),
							...(server.credential ? { credential: server.credential } : {}),
						})),
					}
				: undefined,
		};
	}

	async function handleDisconnect() {
		userDisconnecting.current = true;
		try {
			await endConversation.mutateAsync();
		} catch {
			// end is idempotent server-side; navigate regardless
		}
		await navigate({ to: APP_ROUTES.VOICE });
	}

	if (conversation.isPending) {
		return <VoiceRoomSkeleton />;
	}

	// Every terminal pre-connect state is the same blocking modal as a
	// runtime failure — never an inline page. The room stays mounted behind;
	// leaving ends the conversation.
	if (
		conversation.isError ||
		conversation.data.status !== ConversationStatusPending
	) {
		const failed = conversation.isError;
		return (
			<div className="p-8" aria-hidden="true">
				<SessionModal
					open
					title={
						failed ? m["voice.connectionFailed"]() : m["voice.sessionEnded"]()
					}
					description={m["voice.sessionEnded"]()}
					actionLabel={m["voice.backToScenarios"]()}
					onAction={() => void handleDisconnect()}
				/>
			</div>
		);
	}

	return (
		<PipecatAppBase
			key={conversationId}
			transportType="smallwebrtc"
			startBotParams={startBotParams}
			startBotResponseTransformer={transformStartResponse}
			initDevicesOnMount
			connectOnMount
			noThemeProvider
		>
			{({ client, error, handleDisconnect: disconnect }) => {
				if (!client && !error) return <VoiceRoomSkeleton />;
				// Blocking modal — never a silent swap or redirect. The room
				// stays mounted behind it; leaving ends the conversation.
				const showErrorModal = error != null || connectionLost;
				const detail = error ?? errorDetail;
				return (
					<>
						{client && !connectionLost ? (
							<div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
								<RoomErrorListener
									isUserDisconnectingRef={userDisconnecting}
									onConnectionLost={() => setConnectionLost(true)}
									onRuntimeError={(text) => setErrorDetail(text)}
								/>
								<div className="grid min-h-0 flex-1 items-stretch gap-4 lg:h-[calc(100dvh-5.5rem)] lg:flex-none lg:grid-cols-2">
									<VoicePanel
										title={m["voice.room.freeTalkTitle"]()}
										objective={m["voice.room.freeTalkObjective"]()}
										ending={endConversation.isPending}
										onEnd={() => {
											userDisconnecting.current = true;
											void (async () => {
												await disconnect?.();
												await handleDisconnect();
											})();
										}}
									/>
									<TranscriptPanel className="hidden lg:flex" />
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
												<SheetTitle>
													{m["voice.room.transcriptTitle"]()}
												</SheetTitle>
												<SheetDescription>
													{m["voice.room.freeTalkObjective"]()}
												</SheetDescription>
											</SheetHeader>
											<div className="overflow-hidden px-4 pb-4">
												<TranscriptPanel />
											</div>
										</SheetContent>
									</Sheet>
								</div>
							</div>
						) : (
							<VoiceRoomSkeleton />
						)}
						<SessionModal
							open={showErrorModal}
							title={m["voice.connectionFailed"]()}
							description={detail ?? m["voice.sessionEnded"]()}
							actionLabel={m["voice.backToScenarios"]()}
							onAction={() => void handleDisconnect()}
						/>
					</>
				);
			}}
		</PipecatAppBase>
	);
}

/**
 * The kit surfaces setup failures via the `error` render-prop, but mid-session
 * errors and disconnects only arrive as RTVI events. Any unexpected one flips
 * the room to the blocking error modal (leaving ends the conversation, so the
 * next create force-closes the orphaned row server-side).
 */
function RoomErrorListener({
	isUserDisconnectingRef,
	onConnectionLost,
	onRuntimeError,
}: {
	// Ref object (not a snapshot): .current is read at event time so the End
	// button's disconnect is correctly ignored even without a re-render.
	isUserDisconnectingRef: RefObject<boolean>;
	onConnectionLost: () => void;
	onRuntimeError: (detail: string | null) => void;
}) {
	useRTVIClientEvent(RTVIEvent.Error, (message) => {
		const data = (message as { data?: { error?: unknown; message?: unknown } })
			?.data;
		const text = [data?.error, data?.message].find(
			(value): value is string => typeof value === "string" && value.length > 0,
		);
		onRuntimeError(text ?? null);
		onConnectionLost();
	});
	useRTVIClientEvent(RTVIEvent.Disconnected, () => {
		if (isUserDisconnectingRef.current) return;
		onConnectionLost();
	});
	return null;
}
