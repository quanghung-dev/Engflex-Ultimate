import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import { m } from "#/paraglide/messages";

export function TranscriptHeader({
	analyzedOnly,
	onAnalyzedOnlyChange,
}: {
	analyzedOnly: boolean;
	onAnalyzedOnlyChange: (next: boolean) => void;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
			<div className="flex flex-col leading-tight">
				<span className="text-sm font-bold text-foreground">
					{m["voice.room.transcriptTitle"]()}
				</span>
			</div>
			<Label className="flex items-center gap-2 text-xs text-muted-foreground">
				<Switch
					checked={analyzedOnly}
					onCheckedChange={onAnalyzedOnlyChange}
					size="sm"
				/>
				{m["voice.room.analyzedOnly"]()}
			</Label>
		</div>
	);
}
