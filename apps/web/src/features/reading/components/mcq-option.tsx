import { cn } from "cn";
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
				"flex items-start gap-3 rounded-lg border px-3 py-2.5 transition",
				selected
					? "border-primary bg-secondary"
					: "border-border bg-card hover:border-primary/40",
			)}
		>
			<RadioGroupItem id={id} value={value} className="mt-0.5" />
			<label
				htmlFor={id}
				className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-sm text-foreground"
			>
				<span className="font-semibold">{label}.</span>
				<span>{text}</span>
			</label>
		</div>
	);
}
