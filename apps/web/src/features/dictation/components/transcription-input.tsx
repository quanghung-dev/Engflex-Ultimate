import { Check } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Textarea } from "#/components/ui/textarea";
import { m } from "#/paraglide/messages";

export function TranscriptionInput({
	value,
	onChange,
	onClear,
	onCheck,
}: {
	value: string;
	onChange: (next: string) => void;
	onClear: () => void;
	onCheck: () => void;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
			<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
				{m["lessons.yourTranscription"]()}
			</span>
			<Textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={m["lessons.transcriptionPlaceholder"]()}
				rows={3}
			/>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-xs text-muted-foreground">
					{m["lessons.characters"]({ count: value.length })}
				</span>
				<div className="flex items-center gap-2">
					<Button type="button" variant="ghost" size="sm" onClick={onClear}>
						{m["common.clear"]()}
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={onCheck}
						disabled={value.trim().length === 0}
					>
						<Check data-icon="inline-start" />
						{m["lessons.checkTranscription"]()}
					</Button>
				</div>
			</div>
		</div>
	);
}
