import type { CEFR, ScenarioDifficulty } from "@engflex/contracts";
import type { ColumnDef } from "@tanstack/react-table";
import { CefrBadge } from "#/components/common/cefr-badge";
import type { SelectOption } from "#/features/admin/components/resource-form-dialog";
import { NONE } from "#/features/admin/components/resource-form-dialog";
import { formatDate } from "#/features/admin/format";
import { m } from "#/paraglide/messages";

export const CEFR_LEVELS: CEFR[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const cefrOptions = (): SelectOption[] =>
	CEFR_LEVELS.map((level) => ({ value: level, label: level }));

/** An optional relation's options, led by the `NONE` sentinel. */
export const withNone = (options: SelectOption[]): SelectOption[] => [
	{ value: NONE, label: m["admin.form.none"]() },
	...options,
];

export const fromNone = (value: string): string | undefined =>
	value === NONE ? undefined : value;

const DASH = "—";

/**
 * Primary column: bold text with an optional muted second line. Both lines
 * feed the accessor, so the table search matches either.
 */
export function titleColumn<Row>(
	id: string,
	header: () => string,
	title: (row: Row) => string,
	subtitle?: (row: Row) => string | undefined,
): ColumnDef<Row> {
	return {
		id,
		header,
		accessorFn: (row) => `${title(row)} ${subtitle?.(row) ?? ""}`,
		sortingFn: (a, b) => title(a.original).localeCompare(title(b.original)),
		cell: ({ row }) => {
			const sub = subtitle?.(row.original);
			return (
				<div className="flex max-w-md min-w-0 flex-col">
					<span className="truncate font-semibold text-foreground">
						{title(row.original)}
					</span>
					{sub ? (
						<span className="truncate text-xs text-muted-foreground">
							{sub}
						</span>
					) : null}
				</div>
			);
		},
	};
}

export function textColumn<Row>(
	id: string,
	header: () => string,
	value: (row: Row) => string | number | undefined,
): ColumnDef<Row> {
	return {
		id,
		header,
		accessorFn: (row) => value(row) ?? "",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{value(row.original) ?? DASH}
			</span>
		),
	};
}

export function cefrColumn<Row>(
	value: (row: Row) => CEFR | ScenarioDifficulty | undefined,
	header: () => string = () => m["admin.fields.cefr"](),
): ColumnDef<Row> {
	return {
		id: "cefr",
		header,
		accessorFn: (row) => value(row) ?? "",
		cell: ({ row }) => {
			const level = value(row.original);
			return level ? (
				<CefrBadge value={level} />
			) : (
				<span className="text-muted-foreground">{DASH}</span>
			);
		},
	};
}

export function dateColumn<Row>(
	id: string,
	header: () => string,
	value: (row: Row) => string,
): ColumnDef<Row> {
	return {
		id,
		header,
		// ISO strings sort chronologically as plain text.
		accessorFn: value,
		enableGlobalFilter: false,
		cell: ({ row }) => (
			<span className="whitespace-nowrap text-muted-foreground">
				{formatDate(value(row.original))}
			</span>
		),
	};
}
