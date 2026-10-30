import { MoreVertical, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ToeicAudioPlayer({
	duration = 28,
	playbackRate = 1,
}: {
	duration?: number;
	playbackRate?: number;
}) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (isPlaying) {
			intervalRef.current = setInterval(() => {
				setCurrentTime((prev) => {
					if (prev >= duration) {
						setIsPlaying(false);
						return 0;
					}
					return prev + 1 * playbackRate;
				});
			}, 1000);
		} else if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isPlaying, duration, playbackRate]);

	const togglePlay = () => {
		setIsPlaying((prev) => !prev);
	};

	const progressPct = Math.min(100, (currentTime / duration) * 100);

	return (
		<div className="flex h-11 w-full items-center gap-3 rounded-full border border-border/80 bg-muted/40 px-3.5 py-1.5 shadow-xs">
			{/* Play/Pause Button */}
			<button
				type="button"
				onClick={togglePlay}
				className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
				aria-label={isPlaying ? "Pause" : "Play"}
			>
				{isPlaying ? (
					<Pause className="size-4 fill-current" />
				) : (
					<Play className="size-4 fill-current ml-0.5" />
				)}
			</button>

			{/* Time Display */}
			<div className="shrink-0 text-xs font-mono font-medium text-muted-foreground select-none">
				{formatTime(currentTime)} / {formatTime(duration)}
			</div>

			{/* Progress Bar Track */}
			<div
				className="relative flex h-2 flex-1 cursor-pointer items-center rounded-full bg-border"
				onClick={(e) => {
					const rect = e.currentTarget.getBoundingClientRect();
					const clickX = e.clientX - rect.left;
					const pct = Math.max(0, Math.min(1, clickX / rect.width));
					setCurrentTime(Math.round(pct * duration));
				}}
				onKeyDown={(e) => {
					if (e.key === "ArrowRight") {
						setCurrentTime((t) => Math.min(duration, t + 5));
					} else if (e.key === "ArrowLeft") {
						setCurrentTime((t) => Math.max(0, t - 5));
					}
				}}
				role="progressbar"
				aria-valuenow={Math.round(currentTime)}
				aria-valuemin={0}
				aria-valuemax={duration}
			>
				<div
					className="h-full rounded-full bg-foreground/75"
					style={{ width: `${progressPct}%` }}
				/>
				<div
					className="absolute size-3 -translate-x-1/2 rounded-full border-2 border-background bg-foreground shadow-xs"
					style={{ left: `${progressPct}%` }}
				/>
			</div>

			{/* Volume Icon */}
			<button
				type="button"
				className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
				aria-label="Volume"
			>
				<Volume2 className="size-4" />
			</button>

			{/* More Options */}
			<button
				type="button"
				className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
				aria-label="Options"
			>
				<MoreVertical className="size-4" />
			</button>
		</div>
	);
}
