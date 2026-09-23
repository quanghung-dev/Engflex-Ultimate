import type { VocabularyItem } from "@engflex/contracts";
import { Link } from "@tanstack/react-router";
import { CefrBadge } from "#/components/common/cefr-badge";
import { Button } from "#/components/ui/button";
import { m } from "#/paraglide/messages";

export function RecentCustomWidget({
	items,
	totalCustom,
	onViewAll,
}: {
	items: VocabularyItem[];
	totalCustom: number;
	onViewAll: () => void;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-bold text-foreground">
					{m["vocabulary.recent.title"]()}
				</span>
				<Button type="button" variant="link" size="sm" onClick={onViewAll}>
					{m["vocabulary.recent.viewAll"]({ count: totalCustom })}
				</Button>
			</div>
			<p className="text-xs text-muted-foreground">
				{m["vocabulary.recent.body"]()}
			</p>
			<ul className="flex flex-col gap-3">
				{items.slice(0, 3).map((item) => (
					<li key={item.id} className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold text-foreground">
								{item.term}
							</span>
							<CefrBadge value={item.cefr} />
						</div>
						<p className="text-[11px] text-muted-foreground">
							{item.userState?.note ?? item.definition}
						</p>
						<Link
							to="/vocabulary/$itemId"
							params={{ itemId: item.id }}
							className="w-fit text-[11px] font-semibold text-primary"
						>
							{m["vocabulary.card.review"]()}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
