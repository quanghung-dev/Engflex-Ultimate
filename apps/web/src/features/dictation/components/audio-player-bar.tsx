import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

/** Simulated audio: no files exist — a progress fill over `durationMs`. */
export function AudioPlayerBar({ durationMs }: { durationMs: number }) {
	const [playing, setPlaying] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		if (!playing) return;
		const step = 50;
		const id = window.setInterval(() => {
			setProgress((current) => current + (step / durationMs) * 100);
		}, step);
		return () => window.clearInterval(id);
	}, [playing, durationMs]);

	useEffect(() => {
		if (progress >= 100) {
			setProgress(0);
			setPlaying(false);
		}
	}, [progress]);

	return (
		<div className="flex items-center gap-3">
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				aria-label={
					playing ? m["common.audio.pause"]() : m["common.audio.play"]()
				}
				onClick={() => setPlaying((current) => !current)}
			>
				{playing ? <Pause /> : <Play />}
			</Button>
			<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-[width] duration-50 ease-linear"
					style={{ width: `${Math.min(100, progress)}%` }}
				/>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onClick={() => {
					setPlaying(false);
					setProgress(0);
				}}
			>
				<RotateCcw data-icon="inline-start" />
				{m["common.audio.replay"]()}
			</Button>
		</div>
	);
}
