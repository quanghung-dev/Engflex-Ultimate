import { Check, Lightbulb } from "lucide-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { m } from "#/paraglide/messages";

export function TranscriptionInput({
	value,
	onChange,
	onClear,
	onCheck,
	hint,
}: {
	value: string;
	onChange: (next: string) => void;
	onClear: () => void;
	onCheck: () => void;
	hint: string;
}) {
	const [showHint, setShowHint] = useState(false);

	return (
		<div className="surface-card flex flex-col gap-3 p-5">
			<span className="text-[11px] font-bold text-muted-foreground">
				{m["lessons.dictation.yourTranscription"]()}
			</span>
			<Textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={m["lessons.dictation.placeholder"]()}
				rows={3}
				className="field text-[15px]"
			/>
			<button
				type="button"
				aria-expanded={showHint}
				onClick={() => setShowHint((current) => !current)}
				className="chip w-fit px-2 py-0.5 text-[11px] hover:border-primary"
			>
				<Lightbulb className="size-3.5" />
				{m["lessons.dictation.hint"]()}
			</button>
			{showHint ? (
				<p className="bubble bubble-partner w-fit text-[15px]">{hint}</p>
			) : null}
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-xs font-medium text-muted-foreground">
					{m["lessons.dictation.characters"]({ count: value.length })}
				</span>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="btn btn-outline"
						onClick={onClear}
					>
						{m["common.actions.clear"]()}
					</Button>
					<Button
						type="button"
						size="sm"
						className="btn btn-primary"
						onClick={onCheck}
						disabled={value.trim().length === 0}
					>
						<Check data-icon="inline-start" />
						{m["lessons.dictation.check"]()}
					</Button>
				</div>
			</div>
		</div>
	);
}
