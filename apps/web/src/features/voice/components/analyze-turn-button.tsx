import { Sparkles } from "lucide-react";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export function AnalyzeTurnButton({ onAnalyze }: { onAnalyze: () => void }) {
	return (
		<Button type="button" variant="outline" size="sm" onClick={onAnalyze}>
			<Sparkles data-icon="inline-start" />
			{m["voice.room.analyze"]()}
		</Button>
	);
}
