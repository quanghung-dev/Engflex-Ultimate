export function formatClock(ms: number) {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60)
		.toString()
		.padStart(2, "0");
	const seconds = (totalSeconds % 60).toString().padStart(2, "0");
	return `${minutes}:${seconds}`;
}

export function SessionTimerPill({
	elapsedMs,
	totalSec,
}: {
	elapsedMs: number;
	totalSec: number;
}) {
	return (
		<span className="inline-flex items-center gap-2 px-2.5 py-1 text-xs text-muted-foreground">
			<span className="size-1.5 animate-pulse rounded-full bg-accuracy" />
			<span className="font-semibold text-foreground">
				{formatClock(elapsedMs)}
			</span>
			/ {formatClock(totalSec * 1000)}
		</span>
	);
}
