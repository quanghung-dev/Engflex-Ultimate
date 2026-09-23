import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const TONE_STROKE = {
	primary: "stroke-primary",
	accuracy: "stroke-accuracy",
	violet: "stroke-accent-violet",
} as const;

export function ProgressRing({
	value,
	tone = "primary",
}: {
	value: number;
	tone?: keyof typeof TONE_STROKE;
}) {
	const radius = 26;
	const circumference = 2 * Math.PI * radius;
	const pct = Math.min(100, Math.max(0, value));
	return (
		<svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden="true">
			<circle
				cx="32"
				cy="32"
				r={radius}
				strokeWidth="6"
				className="fill-none stroke-muted"
			/>
			<circle
				cx="32"
				cy="32"
				r={radius}
				strokeWidth="6"
				strokeLinecap="round"
				className={cn("fill-none", TONE_STROKE[tone])}
				strokeDasharray={circumference}
				strokeDashoffset={circumference * (1 - pct / 100)}
			/>
		</svg>
	);
}

export function StatCard({
	label,
	icon: Icon,
	value,
	footer,
	tone = "primary",
	ringValue,
	className,
}: {
	label: string;
	icon?: LucideIcon;
	value: ReactNode;
	footer?: ReactNode;
	tone?: keyof typeof TONE_STROKE;
	ringValue?: number;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-3 rounded-xl border bg-card p-4",
				className,
			)}
		>
			<div className="flex min-w-0 flex-col gap-1">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{label}
				</span>
				<span className="text-2xl font-extrabold tracking-tight text-foreground">
					{value}
				</span>
				{footer ? (
					<span className="text-xs text-muted-foreground">{footer}</span>
				) : null}
			</div>
			{typeof ringValue === "number" ? (
				<ProgressRing value={ringValue} tone={tone} />
			) : Icon ? (
				<span
					className={cn(
						"flex size-10 shrink-0 items-center justify-center rounded-lg",
						tone === "accuracy" && "bg-accuracy-tint text-accuracy",
						tone === "violet" && "bg-secondary text-accent-violet",
						tone === "primary" && "bg-secondary text-primary",
					)}
				>
					<Icon className="size-5" />
				</span>
			) : null}
		</div>
	);
}
