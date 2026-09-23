import { cn } from "cn";
import { Mic } from "lucide-react";

export function VoicePulse({
	phase,
}: {
	phase: "idle" | "listening" | "ai-speaking";
}) {
	return (
		<div className="relative flex h-44 items-center justify-center">
			{[0, 1, 2].map((ring) => (
				<span
					key={ring}
					className={cn(
						"absolute rounded-full border",
						phase === "ai-speaking" ? "border-primary/40" : "border-border",
						phase === "listening" && "animate-pulse",
					)}
					style={{
						width: `${120 + ring * 48}px`,
						height: `${120 + ring * 48}px`,
					}}
				/>
			))}
			<span
				className={cn(
					"relative flex size-24 items-center justify-center rounded-full",
					phase === "ai-speaking"
						? "bg-primary text-primary-foreground"
						: "bg-secondary text-primary",
				)}
			>
				<Mic className="size-8" />
			</span>
			<span className="absolute bottom-0 flex items-end gap-1">
				{[0, 1, 2, 3, 4].map((bar) => (
					<span
						key={bar}
						className={cn(
							"w-1 rounded-full",
							phase === "idle" ? "bg-muted" : "animate-pulse bg-primary",
						)}
						style={{
							height: `${[10, 18, 26, 14, 8][bar]}px`,
							animationDelay: `${bar * 100}ms`,
						}}
					/>
				))}
			</span>
		</div>
	);
}
