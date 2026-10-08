import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { DataTable } from "#/features/admin/components/data-table";
import {
	type FieldSpec,
	type FormValues,
	ResourceFormDialog,
} from "#/features/admin/components/resource-form-dialog";
import { m } from "#/paraglide/messages";

/**
 * Everything a back-office table needs to know about one resource. `toForm`
 * and `fromForm` are the only per-resource mapping: the grid, dialogs,
 * confirmations and toasts are shared.
 */
export interface ResourceConfig<
	Row extends { id: string },
	F extends FormValues,
> {
	/** Singular, lower-case noun spliced into "Add {noun}" / "Edit {noun}". */
	noun: () => string;
	columns: ColumnDef<Row>[];
	fields: FieldSpec<F>[];
	/** Defaults for the create dialog; omit to make the resource edit-only. */
	blank?: () => F;
	toForm: (row: Row) => F;
	/** `row` is the edited original, undefined on create. */
	fromForm: (values: F, row: Row | undefined) => Row;
	label: (row: Row) => string;
}

type Editing<Row> = { mode: "create" } | { mode: "edit"; row: Row };

export function ResourcePanel<
	Row extends { id: string },
	F extends FormValues,
>({
	config,
	rows,
	onSave,
	onDelete,
	toolbar,
}: {
	config: ResourceConfig<Row, F>;
	rows: Row[];
	onSave: (row: Row) => void;
	onDelete: (row: Row) => void;
	toolbar?: ReactNode;
}) {
	const [editing, setEditing] = useState<Editing<Row> | null>(null);
	const [deleting, setDeleting] = useState<Row | null>(null);
	// Bumped per open so the form remounts with fresh initial values.
	const [formKey, setFormKey] = useState(0);
	const noun = config.noun();

	const open = (next: Editing<Row>) => {
		setFormKey((key) => key + 1);
		setEditing(next);
	};

	const columns: ColumnDef<Row>[] = [
		...config.columns,
		{
			id: "actions",
			header: () => (
				<span className="sr-only">{m["admin.table.actions"]()}</span>
			),
			cell: ({ row }) => (
				<div className="flex justify-end">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={m["admin.table.actions"]()}
							>
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onSelect={() => open({ mode: "edit", row: row.original })}
							>
								<Pencil />
								{m["admin.actions.edit"]()}
							</DropdownMenuItem>
							<DropdownMenuItem
								variant="destructive"
								onSelect={() => setDeleting(row.original)}
							>
								<Trash2 />
								{m["admin.actions.delete"]()}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
		},
	];

	const { blank } = config;
	const createButton = blank ? (
		<Button type="button" onClick={() => open({ mode: "create" })}>
			<Plus data-icon="inline-start" />
			{m["admin.actions.add"]({ noun })}
		</Button>
	) : null;

	const original = editing?.mode === "edit" ? editing.row : undefined;

	return (
		<>
			<DataTable
				columns={columns}
				data={rows}
				toolbar={
					toolbar || createButton ? (
						<>
							{toolbar}
							{createButton}
						</>
					) : undefined
				}
			/>
			{editing && (original || blank) ? (
				<ResourceFormDialog
					key={formKey}
					open
					onOpenChange={(next) => {
						if (!next) setEditing(null);
					}}
					title={
						original
							? m["admin.form.editTitle"]({ noun })
							: m["admin.form.createTitle"]({ noun })
					}
					submitLabel={
						original ? m["admin.form.save"]() : m["admin.form.create"]()
					}
					fields={config.fields}
					initial={original ? config.toForm(original) : (blank as () => F)()}
					onSubmit={(values) => {
						onSave(config.fromForm(values, original));
						toast.success(
							original ? m["admin.toast.saved"]() : m["admin.toast.created"](),
						);
						setEditing(null);
					}}
				/>
			) : null}
			<AlertDialog
				open={deleting !== null}
				onOpenChange={(next) => {
					if (!next) setDeleting(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{m["admin.confirm.title"]({
								name: deleting ? config.label(deleting) : "",
							})}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{m["admin.confirm.description"]()}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{m["common.actions.cancel"]()}
						</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								if (!deleting) return;
								onDelete(deleting);
								toast.success(
									m["admin.toast.deleted"]({ name: config.label(deleting) }),
								);
								setDeleting(null);
							}}
						>
							{m["admin.actions.delete"]()}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
