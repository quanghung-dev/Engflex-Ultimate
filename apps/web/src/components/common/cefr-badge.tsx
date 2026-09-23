import type { CEFR, ScenarioDifficulty } from "@engflex/contracts";
import { cn } from "cn";

/** Token-mapped CEFR chip; A1/A2/C2 fall back to the neutral outline style. */
const CEFR_STYLES: Record<string, string> = {
	B1: "border-cefr-b1-border bg-cefr-b1-bg text-cefr-b1",
	"B1+": "border-cefr-b1p-border bg-cefr-b1p-bg text-cefr-b1p",
	B2: "border-cefr-b2-border bg-cefr-b2-bg text-cefr-b2",
	C1: "border-cefr-c1-border bg-cefr-c1-bg text-cefr-c1",
};

export function CefrBadge({
	value,
	className,
}: {
	value: CEFR | ScenarioDifficulty;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold",
				CEFR_STYLES[value] ?? "border-border bg-muted text-muted-foreground",
				className,
			)}
		>
			{value}
		</span>
	);
}
