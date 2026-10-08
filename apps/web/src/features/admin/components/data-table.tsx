import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { m } from "#/paraglide/messages";

const PAGE_SIZE = 10;

/**
 * The one admin grid: global search, click-to-sort headers and paging, all
 * from TanStack Table's row models. Columns with an `accessorFn` are what the
 * search matches and what sorts; display-only columns (actions) set neither.
 */
export function DataTable<Row extends { id: string }>({
	columns,
	data,
	toolbar,
}: {
	columns: ColumnDef<Row>[];
	data: Row[];
	toolbar?: ReactNode;
}) {
	const [globalFilter, setGlobalFilter] = useState("");
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data,
		columns,
		getRowId: (row) => row.id,
		state: { globalFilter, sorting },
		onGlobalFilterChange: setGlobalFilter,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: PAGE_SIZE } },
		// A save can change the filtered set; staying on page 3 of 2 would show
		// an empty grid, so paging resets with the data.
		autoResetPageIndex: true,
	});

	const rows = table.getRowModel().rows;
	const filteredCount = table.getFilteredRowModel().rows.length;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative w-full sm:max-w-xs">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={globalFilter}
						onChange={(event) => setGlobalFilter(event.target.value)}
						placeholder={m["admin.table.search"]()}
						aria-label={m["admin.table.search"]()}
						className="pl-9"
					/>
				</div>
				{toolbar ? (
					<div className="flex flex-wrap items-center gap-2 sm:ml-auto">
						{toolbar}
					</div>
				) : null}
			</div>
			<div className="surface-card overflow-hidden p-0">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((group) => (
							<TableRow key={group.id} className="hover:bg-transparent">
								{group.headers.map((header) => {
									const sorted = header.column.getIsSorted();
									const label = header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											);
									return (
										<TableHead
											key={header.id}
											className="h-11 px-4 text-xs font-semibold text-muted-foreground"
										>
											{header.column.getCanSort() ? (
												<button
													type="button"
													onClick={header.column.getToggleSortingHandler()}
													className="inline-flex items-center gap-1 hover:text-foreground"
												>
													{label}
													{sorted === "asc" ? (
														<ArrowUp className="size-3.5" />
													) : sorted === "desc" ? (
														<ArrowDown className="size-3.5" />
													) : (
														<ChevronsUpDown className="size-3.5 opacity-50" />
													)}
												</button>
											) : (
												label
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{rows.length ? (
							rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="px-4 py-3">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow className="hover:bg-transparent">
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center text-muted-foreground"
								>
									{m["admin.table.empty"]()}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
				<span>
					{m["admin.table.summary"]({
						shown: rows.length,
						total: filteredCount,
					})}
				</span>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						{m["admin.table.previous"]()}
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						{m["admin.table.next"]()}
					</Button>
				</div>
			</div>
		</div>
	);
}
