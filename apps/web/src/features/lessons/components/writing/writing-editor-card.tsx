import { cn } from "cn";
import { Copy, Send } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { m } from "#/paraglide/messages";

export function WritingEditorCard({
	value,
	onChange,
	maxWords,
	onClear,
	onSubmit,
	submitted = false,
}: {
	value: string;
	onChange: (next: string) => void;
	maxWords: number;
	onClear: () => void;
	onSubmit: () => void;
	submitted?: boolean;
}) {
	const words = value.trim() ? value.trim().split(/\s+/).length : 0;
	const overLimit = words > maxWords;

	return (
		<div className="surface-card flex h-full flex-col gap-3 p-5">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-lg font-bold text-foreground">
					{m["lessons.writing.responseTitle"]()}
				</h2>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="btn btn-outline px-2"
					onClick={() => {
						void navigator.clipboard?.writeText(value).catch(() => {});
					}}
				>
					<Copy data-icon="inline-start" />
					{m["common.actions.copy"]()}
				</Button>
			</div>
			<Textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				rows={7}
				placeholder={m["lessons.writing.placeholder"]()}
				className="field min-h-40 text-[15px]"
				disabled={submitted}
			/>
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={cn(
						"chip px-2 py-0.5 text-[11px]",
						overLimit && "border-ai-coral text-ai-coral",
					)}
				>
					{m["lessons.writing.wordsCount"]({ count: words, max: maxWords })}
				</span>
			</div>
			<div className="mt-auto flex items-center justify-between gap-2 pt-1">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="btn btn-outline"
					onClick={onClear}
					disabled={submitted}
				>
					{m["common.actions.clear"]()}
				</Button>
				<Button
					type="button"
					size="sm"
					className="btn btn-primary"
					onClick={onSubmit}
					disabled={words === 0 || submitted}
				>
					<Send data-icon="inline-start" />
					{m["lessons.writing.submit"]()}
				</Button>
			</div>
		</div>
	);
}
