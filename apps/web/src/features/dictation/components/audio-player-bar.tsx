import { cn } from "cn";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

const BARS = 28;

function formatMs(ms: number): string {
	const totalSeconds = Math.max(0, Math.round(ms / 1000));
	return `0:${String(totalSeconds).padStart(2, "0")}`;
}

/** Simulated audio: no files exist — a progress fill over `durationMs`. */
export function AudioPlayerBar({ durationMs }: { durationMs: number }) {
	const [playing, setPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [slow, setSlow] = useState(false);

	useEffect(() => {
		if (!playing) return;
		const step = slow ? 25 : 50;
		const id = window.setInterval(() => {
			setProgress((current) => current + (step / durationMs) * 100);
		}, step);
		return () => window.clearInterval(id);
	}, [playing, durationMs, slow]);

	useEffect(() => {
		if (progress >= 100) {
			setProgress(0);
			setPlaying(false);
		}
	}, [progress]);

	const filledBars = Math.round((Math.min(100, progress) / 100) * BARS);

	return (
		<div
			className="flex flex-col gap-2 p-4"
			style={{
				background: "var(--accent)",
				borderRadius: 16,
				boxShadow: "0 3px 0 var(--border)",
			}}
		>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					aria-label={
						playing ? m["common.audio.pause"]() : m["common.audio.play"]()
					}
					onClick={() => setPlaying((current) => !current)}
					className="btn btn-primary h-12 w-12 rounded-full p-0"
				>
					{playing ? <Pause /> : <Play />}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="btn btn-outline px-2"
					onClick={() =>
						setProgress((current) =>
							Math.max(0, current - (5000 / durationMs) * 100),
						)
					}
				>
					<RotateCcw data-icon="inline-start" />
					5s
				</Button>
				<span className="ml-auto flex items-center gap-1">
					<button
						type="button"
						aria-pressed={!slow}
						onClick={() => setSlow(false)}
						className={cn(
							"chip px-2 py-0 text-[11px]",
							!slow && "chip-selected",
						)}
					>
						1.0x
					</button>
					<button
						type="button"
						aria-pressed={slow}
						onClick={() => setSlow(true)}
						className={cn(
							"chip px-2 py-0 text-[11px]",
							slow && "chip-selected",
						)}
					>
						0.8x
					</button>
				</span>
			</div>
			<div
				className="flex h-12 items-center gap-1 rounded-[16px] bg-card px-3"
				aria-hidden="true"
			>
				{BARS
					? Array.from({ length: BARS }, (_, index) => {
							const height = 8 + ((index * 7) % 20);
							return (
								<span
									// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length decorative waveform — the bars never reorder and each bar's height derives from its own index, so index IS the identity here.
									key={index}
									className={cn(
										"w-1 shrink-0 rounded-full",
										index < filledBars ? "bg-secondary" : "bg-primary",
									)}
									style={{ height, opacity: index < filledBars ? 1 : 0.45 }}
								/>
							);
						})
					: null}
			</div>
			<div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
				<span>{formatMs((progress / 100) * durationMs)}</span>
				<span>
					{m["common.audio.total"]()} {formatMs(durationMs)}
				</span>
			</div>
		</div>
	);
}
