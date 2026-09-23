import { cn } from "cn";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export function MicControls({
	micMuted,
	onToggleMic,
	onEnd,
}: {
	micMuted: boolean;
	onToggleMic: () => void;
	onEnd: () => void;
}) {
	const [speakerMuted, setSpeakerMuted] = useState(false);

	return (
		<div className="flex items-center justify-center gap-3">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				aria-label={
					speakerMuted
						? m["voice.room.micUnmuteSpeaker"]()
						: m["voice.room.micMuteSpeaker"]()
				}
				onClick={() => setSpeakerMuted((current) => !current)}
			>
				{speakerMuted ? <VolumeX /> : <Volume2 />}
			</Button>

			<Button
				type="button"
				onClick={onToggleMic}
				aria-pressed={micMuted}
				aria-label={
					micMuted
						? m["voice.room.micUnmuteMic"]()
						: m["voice.room.micMuteMic"]()
				}
				className={cn(
					"size-14 rounded-full",
					micMuted &&
						"bg-ai-coral text-primary-foreground hover:bg-ai-coral/90",
				)}
			>
				{micMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
			</Button>

			<Button
				type="button"
				variant="destructive"
				size="icon"
				aria-label={m["voice.room.micEnd"]()}
				onClick={onEnd}
			>
				<PhoneOff />
			</Button>
		</div>
	);
}
