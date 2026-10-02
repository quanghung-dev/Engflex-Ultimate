import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import type { RefObject } from "react";

/**
 * The kit surfaces setup failures via the `error` render-prop, but mid-session
 * errors and disconnects only arrive as RTVI events. Any unexpected one flips
 * the room to the blocking error modal (leaving ends the conversation, so the
 * next create force-closes the orphaned row server-side).
 */
export function RoomErrorListener({
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
		const data = (
			message as {
				data?: { error?: unknown; message?: unknown; fatal?: unknown };
			}
		)?.data;
		const text = [data?.error, data?.message].find(
			(value): value is string => typeof value === "string" && value.length > 0,
		);
		onRuntimeError(text ?? null);
		// Pipecat's RTVI processor forwards EVERY pipeline error to the
		// client, including non-fatal ones the engine already recovered from
		// (fatal: false, e.g. a single TTS context with no audio on cold
		// start). Modaling on those kills a live session from the user's
		// perspective while the bot keeps running. Record the detail — a
		// later unexpected disconnect surfaces it — but only flip to the
		// blocking modal for fatal or unknown errors.
		if (data?.fatal !== false) {
			onConnectionLost();
		}
	});
	useRTVIClientEvent(RTVIEvent.Disconnected, () => {
		if (isUserDisconnectingRef.current) return;
		onConnectionLost();
	});
	return null;
}
