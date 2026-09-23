import type { Goal } from "@engflex/contracts";
import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { Button } from "#/components/ui/button";

export function GoalChip({
	value,
	label,
	icon: Icon,
	selected,
	onSelect,
}: {
	value: Goal;
	label: string;
	icon: LucideIcon;
	selected: boolean;
	onSelect: (value: Goal) => void;
}) {
	return (
		<Button
			type="button"
			variant="outline"
			aria-pressed={selected}
			onClick={() => onSelect(value)}
			className={cn(
				"h-auto flex-col gap-2 px-4 py-3",
				selected && "border-primary bg-secondary text-primary",
			)}
		>
			<Icon className="size-4" />
			{label}
		</Button>
	);
}
