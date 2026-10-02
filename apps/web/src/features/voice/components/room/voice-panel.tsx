import {
	PipecatClientMicToggle,
	usePipecatClientMediaTrack,
} from "@pipecat-ai/client-react";
import { CircularWaveform } from "@pipecat-ai/voice-ui-kit";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import type { ReactNode } from "react";
import { SubmitButton } from "#/components/common/submit-button";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { m } from "#/paraglide/messages";

/**
 * The call surface view: pure rendering over a resolved audio track and an
 * injected mic control. The container below injects the live track and
 * toggle; the DEV preview renders the same container inside an idle
 * PipecatAppBase shell (no connect, no devices), so the track is simply
 * absent and the visual idles. Tweak layout here.
 *
 * The kit visualizer renders inside .vkui-root only — the kit scoped
 * stylesheet redefines shared utilities and would stomp the app theme
 * otherwise. Our own controls stay outside.
 */
function VoicePanelView({
	title,
	objective,
	onEnd,
	ending,
	audioTrack,
	micSlot,
	headerAction,
}: {
	title: string;
	objective: string;
	onEnd: () => void;
	ending: boolean;
	audioTrack?: MediaStreamTrack | null;
	micSlot: ReactNode;
	headerAction?: ReactNode;
}) {
	return (
		<Card className="h-full">
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<div>
						<CardTitle>{title}</CardTitle>
						<CardDescription>{objective}</CardDescription>
					</div>
					{headerAction}
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col items-center gap-6 pb-6">
				<div className="flex flex-1 items-center justify-center">
					<div className="vkui-root flex w-full justify-center">
						<CircularWaveform
							audioTrack={audioTrack}
							isThinking={false}
							sensitivity={1.5}
							size={240}
							// color1="#3155ff"
							// color2="#9db4ff"
						/>
					</div>
				</div>
				{/*<p className="text-xs text-muted-foreground">
					{m["voice.room.spaceHint"]()}
				</p>*/}
				<div className="flex flex-wrap items-center justify-center gap-3">
					{micSlot}
					<Tooltip>
						<TooltipTrigger asChild>
							<SubmitButton
								type="button"
								variant="destructive"
								size="icon-lg"
								pending={ending}
								onClick={onEnd}
								aria-label={m["voice.room.micEnd"]()}
							>
								<PhoneOff />
							</SubmitButton>
						</TooltipTrigger>
						<TooltipContent>{m["voice.room.micEnd"]()}</TooltipContent>
					</Tooltip>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * The call surface: one component for the room and the DEV preview. Live
 * audio visual plus mic / end controls.
 *
 * The waveform is always driven by a real track — the bot's audio in a live
 * session, or the local mic when `waveformSource="mic"`. No thinking mock:
 * without a track (preview shell) it idles.
 */
export function VoicePanel({
	title,
	objective,
	onEnd,
	ending,
	waveformSource = "bot",
	headerAction,
}: {
	title: string;
	objective: string;
	onEnd: () => void;
	ending: boolean;
	waveformSource?: "bot" | "mic";
	headerAction?: ReactNode;
}) {
	const botTrack = usePipecatClientMediaTrack("audio", "bot");
	const micTrack = usePipecatClientMediaTrack("audio", "local");
	const audioTrack = waveformSource === "mic" ? micTrack : botTrack;
	return (
		<VoicePanelView
			title={title}
			objective={objective}
			onEnd={onEnd}
			ending={ending}
			audioTrack={audioTrack}
			headerAction={headerAction}
			micSlot={
				<PipecatClientMicToggle>
					{({ disabled, isMicEnabled, onClick }) => {
						const label = isMicEnabled
							? m["voice.room.micMuteMic"]()
							: m["voice.room.micUnmuteMic"]();
						return (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="outline"
										size="icon-lg"
										disabled={disabled}
										onClick={onClick}
										aria-label={label}
									>
										{isMicEnabled ? <MicOff /> : <Mic />}
									</Button>
								</TooltipTrigger>
								<TooltipContent>{label}</TooltipContent>
							</Tooltip>
						);
					}}
				</PipecatClientMicToggle>
			}
		/>
	);
}
