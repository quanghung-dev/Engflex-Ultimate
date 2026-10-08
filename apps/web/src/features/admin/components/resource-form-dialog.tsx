import { cn } from "cn";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { m } from "#/paraglide/messages";

export type FieldValue = string | number | boolean;
export type FormValues = Record<string, FieldValue>;

/**
 * Radix Select reserves "" for "no selection", so an optional relation
 * (deck → category) needs a real sentinel value; `fromForm` maps it back to
 * `undefined`.
 */
export const NONE = "none";

export interface SelectOption {
	value: string;
	label: string;
}

export interface FieldSpec<F extends FormValues> {
	name: Extract<keyof F, string>;
	label: () => string;
	kind: "text" | "textarea" | "number" | "select" | "switch";
	/** A thunk, so labels resolve at render and options track store changes. */
	options?: () => SelectOption[];
	required?: boolean;
	/** Span both columns of the two-column grid. */
	full?: boolean;
}

/**
 * Field-spec form: each resource declares its fields once and this renders,
 * validates and returns typed values. The parent remounts it per open (via
 * `key`), so the initial values never go stale between rows.
 */
export function ResourceFormDialog<F extends FormValues>({
	open,
	onOpenChange,
	title,
	submitLabel,
	fields,
	initial,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	submitLabel: string;
	fields: FieldSpec<F>[];
	initial: F;
	onSubmit: (values: F) => void;
}) {
	const [values, setValues] = useState<F>(initial);
	const [error, setError] = useState<string | null>(null);

	const set = (name: keyof F, value: FieldValue) =>
		setValues((current) => ({ ...current, [name]: value }));

	function validate(): string | null {
		for (const field of fields) {
			const value = values[field.name];
			if (field.kind === "number") {
				if (!Number.isFinite(value) || (value as number) < 0) {
					return m["admin.form.invalidNumber"]({ field: field.label() });
				}
			} else if (field.required && typeof value === "string" && !value.trim()) {
				return m["admin.form.required"]({ field: field.label() });
			}
		}
		return null;
	}

	function submit() {
		const problem = validate();
		if (problem) {
			setError(problem);
			return;
		}
		onSubmit(values);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						submit();
					}}
					className="flex flex-col gap-4"
				>
					<FieldGroup className="grid gap-3 sm:grid-cols-2">
						{fields.map((field) => {
							const id = `admin-field-${field.name}`;
							const value = values[field.name];
							return (
								<Field
									key={field.name}
									className={cn(
										(field.full || field.kind === "textarea") &&
											"sm:col-span-2",
									)}
									orientation={
										field.kind === "switch" ? "horizontal" : undefined
									}
								>
									<FieldLabel htmlFor={id}>{field.label()}</FieldLabel>
									{field.kind === "textarea" ? (
										<Textarea
											id={id}
											rows={3}
											value={String(value)}
											onChange={(event) => set(field.name, event.target.value)}
										/>
									) : field.kind === "select" ? (
										<Select
											value={String(value)}
											onValueChange={(next) => set(field.name, next)}
										>
											<SelectTrigger id={id} className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{(field.options?.() ?? []).map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : field.kind === "switch" ? (
										<Switch
											id={id}
											checked={Boolean(value)}
											onCheckedChange={(next) => set(field.name, next)}
										/>
									) : (
										<Input
											id={id}
											type={field.kind === "number" ? "number" : "text"}
											min={field.kind === "number" ? 0 : undefined}
											step="any"
											value={String(value)}
											onChange={(event) =>
												set(
													field.name,
													field.kind === "number"
														? event.target.valueAsNumber
														: event.target.value,
												)
											}
										/>
									)}
								</Field>
							);
						})}
					</FieldGroup>
					{error ? <FieldError>{error}</FieldError> : null}
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
						>
							{m["common.actions.cancel"]()}
						</Button>
						<Button type="submit">{submitLabel}</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
