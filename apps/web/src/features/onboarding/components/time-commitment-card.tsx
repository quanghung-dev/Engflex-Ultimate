import { cn } from "cn";
import { Badge } from "#/components/ui/badge";
import { m } from "#/paraglide/messages";

export function TimeCommitmentCard({
	minutes,
	label,
	sub,
	recommended = false,
	selected,
	onSelect,
}: {
	minutes: number;
	label: string;
	sub: string;
	recommended?: boolean;
	selected: boolean;
	onSelect: (minutes: number) => void;
}) {
	return (
		<div className={cn("relative", selected && "energy-card")}>
			{recommended ? (
				<Badge className="absolute -top-2 right-3 z-10" variant="secondary">
					{m["onboarding.recommended"]()}
				</Badge>
			) : null}
			<button
				type="button"
				onClick={() => onSelect(minutes)}
				aria-pressed={selected}
				className={cn(
					"flex h-full w-full flex-col items-start gap-1 rounded-[14px] border p-4 text-left transition",
					selected
						? "energy-card-inner border-transparent"
						: "border-border bg-card hover:border-primary/40",
				)}
			>
				<span className="text-lg font-extrabold tracking-tight">
					{m["onboarding.minutesUnit"]({ count: minutes })}
				</span>
				<span className="text-xs font-semibold">{label}</span>
				<span className="text-[11px] text-muted-foreground">{sub}</span>
			</button>
		</div>
	);
}
