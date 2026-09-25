import {
	PipecatClientMicToggle,
	usePipecatClientMediaTrack,
} from "@pipecat-ai/client-react";
import { CircularWaveform } from "@pipecat-ai/voice-ui-kit";
import { Mic, MicOff, PhoneOff } from "lucide-react";
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
 * Left half of the dual-panel room (sona VoicePanel equivalent): live audio
 * visual plus mic / end controls. The kit visualizer renders inside
 * .vkui-root only — the kit scoped stylesheet redefines shared utilities and
 * would stomp the app theme otherwise. Our own controls stay outside.
 *
 * The waveform is always driven by a real track — the bot's audio in a live
 * session, or the local mic when `waveformSource="mic"`. No thinking mock:
 * without a track it idles.
 */
export function VoicePanel({
	title,
	objective,
	onEnd,
	ending,
	waveformSource = "bot",
}: {
	title: string;
	objective: string;
	onEnd: () => void;
	ending: boolean;
	waveformSource?: "bot" | "mic";
}) {
	const botTrack = usePipecatClientMediaTrack("audio", "bot");
	const micTrack = usePipecatClientMediaTrack("audio", "local");
	const audioTrack = waveformSource === "mic" ? micTrack : botTrack;
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{objective}</CardDescription>
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
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="destructive"
								size="icon-lg"
								disabled={ending}
								onClick={onEnd}
								aria-label={m["voice.room.micEnd"]()}
							>
								<PhoneOff />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{m["voice.room.micEnd"]()}</TooltipContent>
					</Tooltip>
				</div>
			</CardContent>
		</Card>
	);
}
