import { cn } from "cn";

export function ScenarioSelectorRow({
	title,
	status,
	selected,
	onSelect,
}: {
	title: string;
	status: string;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={selected}
			onClick={onSelect}
			className={cn(
				"flex w-full items-center justify-between gap-3 rounded-[16px] border-2 px-3 py-2 text-left text-xs transition",
				selected
					? "border-primary bg-accent"
					: "border-border bg-card hover:border-primary",
			)}
		>
			<span className="truncate font-medium text-foreground">{title}</span>
			<span
				className={cn(
					"shrink-0 text-[11px] font-semibold",
					selected ? "text-primary" : "text-muted-foreground",
				)}
			>
				{status}
			</span>
		</button>
	);
}
