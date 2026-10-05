import { MoMascot } from "#/components/common/mo-mascot";
import { Button } from "#/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "#/components/ui/empty";
import { m } from "#/paraglide/messages";

/**
 * The one filter-empty state. The hub list pages (lessons, vocabulary,
 * scenarios) share this exact block — confused Mo, title, optional body,
 * and the shared reset-filters action — so it lives here instead of being
 * repeated per page. Titles and bodies stay with their pages (single
 * consumer each); only the reset action is shared, hence `common.*`.
 */
export function EmptyList({
	title,
	description,
	onReset,
}: {
	title: string;
	description?: string;
	onReset: () => void;
}) {
	return (
		<Empty className="surface-card items-center text-center">
			<MoMascot variant="confused" size={72} />
			<EmptyHeader>
				<EmptyTitle>{title}</EmptyTitle>
				{description ? (
					<EmptyDescription>{description}</EmptyDescription>
				) : null}
			</EmptyHeader>
			<EmptyContent>
				<Button variant="outline" className="btn btn-outline" onClick={onReset}>
					{m["common.actions.resetFilters"]()}
				</Button>
			</EmptyContent>
		</Empty>
	);
}
