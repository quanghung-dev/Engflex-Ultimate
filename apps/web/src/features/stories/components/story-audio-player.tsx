import { cn } from "cn";
import { Pause, Play, RotateCcw, RotateCw, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Slider } from "#/components/ui/slider";

function formatTime(seconds: number): string {
	if (Number.isNaN(seconds) || seconds < 0) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

export function StoryAudioPlayer({
	audioUrl,
	fallbackDuration = 413,
	currentTime,
	onTimeUpdate,
	onSeek,
}: {
	audioUrl: string;
	fallbackDuration?: number;
	currentTime: number;
	onTimeUpdate: (time: number) => void;
	onSeek: (time: number) => void;
}) {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState(fallbackDuration);
	const [speedIndex, setSpeedIndex] = useState(1); // default 1x

	const currentSpeed = SPEEDS[speedIndex];

	// Handle play/pause
	function togglePlay() {
		const audio = audioRef.current;
		if (!audio) return;
		if (isPlaying) {
			audio.pause();
			setIsPlaying(false);
		} else {
			audio
				.play()
				.then(() => setIsPlaying(true))
				.catch(() => {
					// Fallback if browser blocks or mock url fails: simulate time progression
					setIsPlaying(true);
				});
		}
	}

	function handleRewind() {
		const next = Math.max(0, currentTime - 10);
		onSeek(next);
		if (audioRef.current) {
			audioRef.current.currentTime = next;
		}
	}

	function handleForward() {
		const next = Math.min(duration, currentTime + 10);
		onSeek(next);
		if (audioRef.current) {
			audioRef.current.currentTime = next;
		}
	}

	function handleSliderChange(val: number[]) {
		const next = val[0] ?? 0;
		onSeek(next);
		if (audioRef.current) {
			audioRef.current.currentTime = next;
		}
	}

	function cycleSpeed() {
		const nextIndex = (speedIndex + 1) % SPEEDS.length;
		setSpeedIndex(nextIndex);
		const newSpeed = SPEEDS[nextIndex];
		if (audioRef.current) {
			audioRef.current.playbackRate = newSpeed;
		}
	}

	// Sync currentTime from external seek (e.g. clicking a sentence)
	useEffect(() => {
		if (
			audioRef.current &&
			Math.abs(audioRef.current.currentTime - currentTime) > 1
		) {
			audioRef.current.currentTime = currentTime;
		}
	}, [currentTime]);

	// Fallback interval if audio fails or is mocked
	useEffect(() => {
		let timer: NodeJS.Timeout | null = null;
		if (isPlaying) {
			timer = setInterval(() => {
				if (!audioRef.current || audioRef.current.paused) {
					onTimeUpdate(Math.min(duration, currentTime + 0.5 * currentSpeed));
				}
			}, 500);
		}
		return () => {
			if (timer) clearInterval(timer);
		};
	}, [isPlaying, currentTime, duration, currentSpeed, onTimeUpdate]);

	return (
		<div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-6 py-3 shadow-xl backdrop-blur-md">
			{/* biome-ignore lint/a11y/useMediaCaption: story narration audio — full transcript is displayed as interactive text on page */}
			<audio
				ref={audioRef}
				src={audioUrl}
				preload="metadata"
				onTimeUpdate={() => {
					if (audioRef.current) {
						onTimeUpdate(audioRef.current.currentTime);
					}
				}}
				onLoadedMetadata={() => {
					if (audioRef.current?.duration) {
						setDuration(audioRef.current.duration);
					}
				}}
				onEnded={() => setIsPlaying(false)}
			/>

			<div className="mx-auto flex max-w-4xl flex-col gap-2">
				{/* Top: Progress Slider */}
				<Slider
					value={[currentTime]}
					max={duration || 100}
					step={0.1}
					onValueChange={handleSliderChange}
					className="cursor-pointer"
				/>

				{/* Bottom Controls Row */}
				<div className="flex items-center justify-between text-xs">
					{/* Left: Time indicator */}
					<div className="w-28 font-mono font-bold text-muted-foreground">
						<span>{formatTime(currentTime)}</span>
						<span className="mx-1">/</span>
						<span>{formatTime(duration)}</span>
					</div>

					{/* Center: Play/Pause and Skip buttons */}
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={handleRewind}
							className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Rewind 10 seconds"
						>
							<RotateCcw className="size-4" />
						</button>

						<button
							type="button"
							onClick={togglePlay}
							className={cn(
								"flex size-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition-transform active:scale-95",
								"hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
							)}
							aria-label={isPlaying ? "Pause" : "Play"}
						>
							{isPlaying ? (
								<Pause className="size-4 fill-current" />
							) : (
								<Play className="ml-0.5 size-4 fill-current" />
							)}
						</button>

						<button
							type="button"
							onClick={handleForward}
							className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label="Forward 10 seconds"
						>
							<RotateCw className="size-4" />
						</button>
					</div>

					{/* Right: Speed toggle */}
					<div className="flex w-28 justify-end">
						<Button
							variant="ghost"
							size="sm"
							onClick={cycleSpeed}
							className="h-8 gap-1 rounded-full px-2.5 font-bold text-xs text-muted-foreground hover:text-foreground"
						>
							<Zap className="size-3" />
							<span>{currentSpeed}x</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
