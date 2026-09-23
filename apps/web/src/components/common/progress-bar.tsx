import { cn } from "cn";

export function ProgressBar({
	value,
	tone = "primary",
	className,
}: {
	value: number;
	tone?: "primary" | "accuracy";
	className?: string;
}) {
	const pct = Math.min(100, Math.max(0, Math.round(value)));
	return (
		<div
			className={cn(
				"h-1.5 w-full overflow-hidden rounded-full bg-muted",
				className,
			)}
			role="progressbar"
			aria-valuenow={pct}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<div
				className={cn(
					"h-full rounded-full",
					tone === "accuracy" ? "bg-accuracy" : "bg-primary",
				)}
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}
