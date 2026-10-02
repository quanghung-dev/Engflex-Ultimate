import {
	ConversationStatusEnded,
	ConversationStatusFailed,
} from "@engflex/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { APP_ROUTES } from "#/app/app-route";
import { breadcrumb } from "#/app/breadcrumbs";
import { VoiceRoom } from "#/features/voice/components/room/voice-room";
import { useVoiceSession } from "#/features/voice/hooks/use-voice-session";
import { m } from "#/paraglide/messages";

export const Route = createFileRoute("/_app/voice/room/$conversationId")({
	staticData: breadcrumb([
		{ label: () => m["nav.voice"](), target: { to: APP_ROUTES.VOICE } },
		() => m["voice.roomCrumb"](),
	]),
	component: VoiceRoomPage,
});

/** Production injector: live session state in, same VoiceRoom out. */
function VoiceRoomPage() {
	const { conversationId } = Route.useParams();
	const navigate = useNavigate();
	const exit = () => navigate({ to: APP_ROUTES.VOICE });
	const session = useVoiceSession(conversationId, exit);
	const status = session.conversation.data?.status;

	return (
		<VoiceRoom
			session={{
				ready: session.ready,
				query: session.conversation.isPending
					? "pending"
					: session.conversation.isError
						? "error"
						: "ok",
				ended:
					status === ConversationStatusEnded ||
					status === ConversationStatusFailed,
				endPending: session.endPending,
				connectionLost: session.connectionLost,
				errorDetail: session.errorDetail,
				onExit: () => void session.handleExit(),
				onBack: () => void exit(),
				onEnd: () => void session.handleEnd(),
				onConnectionLost: () => session.setConnectionLost(true),
				onRuntimeError: (text) => session.setErrorDetail(text),
				isUserDisconnectingRef: session.userDisconnecting,
			}}
			connection={{
				key: conversationId,
				startBotParams: session.startBotParams,
				transformStartResponse: session.transformStartResponse,
				connect: true,
			}}
			source={{ kind: "live", conversationId }}
		/>
	);
}
