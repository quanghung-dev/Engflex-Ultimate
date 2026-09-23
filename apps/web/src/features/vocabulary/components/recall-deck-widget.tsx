import type { VocabularyItem } from "@engflex/contracts";
import { ChartColumn, Play } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { isDue } from "#/features/vocabulary/dates";
import { TODAY } from "#/features/vocabulary/fixtures";
import { m } from "#/paraglide/messages";

export function RecallDeckWidget({
	items,
	dueToday,
}: {
	items: VocabularyItem[];
	dueToday: number;
}) {
	const due = items.filter((item) => isDue(item.userState?.srsDueAt));

	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
			<div className="flex items-center gap-2">
				<span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
					<ChartColumn className="size-4" />
				</span>
				<div className="flex flex-col leading-tight">
					<span className="text-sm font-bold text-foreground">
						{m["vocabulary.recall.title"]()}
					</span>
					<span className="text-[11px] text-muted-foreground">
						{m["vocabulary.recall.subtitle"]()}
					</span>
				</div>
				<Badge variant="secondary" className="ml-auto text-ai-coral">
					{m["vocabulary.recall.dueBadge"]({ count: dueToday })}
				</Badge>
			</div>
			<p className="text-xs text-muted-foreground">
				{m["vocabulary.recall.body"]()}
			</p>
			<ol className="flex flex-col gap-1">
				{due.slice(0, 3).map((item, index) => (
					<li
						key={item.id}
						className="flex items-center justify-between gap-2 text-xs"
					>
						<span className="truncate text-foreground">
							{index + 1}. {item.term}
						</span>
						<span className="shrink-0 text-muted-foreground">
							{item.userState?.srsDueAt?.slice(0, 10) === TODAY
								? m["vocabulary.recall.dueToday"]()
								: m["vocabulary.recall.overdue"]()}
						</span>
					</li>
				))}
			</ol>
			<Button type="button" onClick={() => toast(m["common.flashcardSoon"]())}>
				<Play data-icon="inline-start" />
				{m["vocabulary.recall.start"]({ count: dueToday })}
			</Button>
		</div>
	);
}
