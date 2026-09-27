import { Mic } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

/** mock-only: no contract type yet — scripted local mic test states. */
export type CalibrationState = "idle" | "listening" | "ready";

export function AudioCalibrationBanner() {
	const [state, setState] = useState<CalibrationState>("idle");

	useEffect(() => {
		if (state !== "listening") return;
		const id = window.setTimeout(() => setState("ready"), 1500);
		return () => window.clearTimeout(id);
	}, [state]);

	return (
		<div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
			<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
				<Mic className="size-5" />
			</span>
			<div className="flex min-w-0 flex-col gap-0.5">
				<span className="flex items-center gap-2 text-sm font-semibold text-foreground">
					{m["voice.calibration.title"]()}
					<span className="size-1.5 animate-pulse rounded-full bg-accuracy" />
				</span>
				<span className="text-xs text-muted-foreground">
					{state === "ready"
						? m["voice.calibration.ready"]()
						: m["voice.calibration.device"]()}
				</span>
			</div>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="ml-auto"
				onClick={() => setState("listening")}
			>
				{state === "listening"
					? m["voice.calibration.listening"]()
					: m["voice.calibration.cta"]()}
			</Button>
		</div>
	);
}
