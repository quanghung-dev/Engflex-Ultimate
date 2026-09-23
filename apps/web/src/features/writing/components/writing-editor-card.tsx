import { cn } from "cn";
import { Send } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { m } from "#/paraglide/messages";

export function WritingEditorCard({
	value,
	onChange,
	maxWords,
	onClear,
	onSubmit,
}: {
	value: string;
	onChange: (next: string) => void;
	maxWords: number;
	onClear: () => void;
	onSubmit: () => void;
}) {
	const words = value.trim() ? value.trim().split(/\s+/).length : 0;
	const overLimit = words > maxWords;

	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<Textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				rows={7}
				placeholder={m["lessons.writingPlaceholder"]()}
			/>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span
					className={cn(
						"text-xs",
						overLimit ? "font-semibold text-ai-coral" : "text-muted-foreground",
					)}
				>
					{m["lessons.wordsCount"]({ count: words, max: maxWords })}
				</span>
				<div className="flex items-center gap-2">
					<Button type="button" variant="ghost" size="sm" onClick={onClear}>
						{m["common.clear"]()}
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={onSubmit}
						disabled={words === 0}
					>
						<Send data-icon="inline-start" />
						{m["lessons.submitFeedback"]()}
					</Button>
				</div>
			</div>
		</div>
	);
}
