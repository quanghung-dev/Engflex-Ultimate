import { cn } from "cn";
import { Check } from "lucide-react";
import { RadioGroupItem } from "#/components/ui/radio-group";

export function McqOption({
	id,
	value,
	label,
	text,
	selected,
}: {
	id: string;
	value: string;
	label: string;
	text: string;
	selected: boolean;
}) {
	return (
		<div
			className={cn(
				"flex cursor-pointer items-center gap-3 rounded-[16px] border-2 p-3 transition focus-within:border-primary",
				selected
					? "border-primary bg-accent"
					: "border-border bg-card hover:border-primary",
			)}
			style={selected ? { boxShadow: "0 3px 0 var(--border)" } : undefined}
		>
			<RadioGroupItem id={id} value={value} className="sr-only" />
			<span
				aria-hidden="true"
				className={cn(
					"inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
					selected
						? "bg-primary text-primary-foreground"
						: "bg-muted text-muted-foreground",
				)}
			>
				{label}
			</span>
			<label
				htmlFor={id}
				className="min-w-0 flex-1 cursor-pointer text-[15px] font-medium text-foreground"
			>
				{text}
			</label>
			{selected ? (
				<Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
			) : null}
		</div>
	);
}
