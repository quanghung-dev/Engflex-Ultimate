import type {
	CreateCustomScenario,
	ScenarioDifficulty,
} from "@engflex/contracts";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { m } from "#/paraglide/messages";

const DIFFICULTIES: ScenarioDifficulty[] = ["B1+", "B2", "C1"];

const EMPTY_FORM = {
	title: "",
	objective: "",
	difficulty: "B2" as ScenarioDifficulty,
	durationMin: 5,
	durationMax: 10,
};

export function CustomScenarioBanner({
	onCreate,
}: {
	onCreate: (input: CreateCustomScenario) => void;
}) {
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);
	const [error, setError] = useState<string | null>(null);

	function submit() {
		if (!form.title.trim() || !form.objective.trim()) {
			setError(m["voice.custom.required"]());
			return;
		}
		if (
			form.durationMin < 1 ||
			form.durationMax > 60 ||
			form.durationMin > form.durationMax
		) {
			setError(m["voice.custom.durationError"]());
			return;
		}
		onCreate({
			title: form.title.trim(),
			objective: form.objective.trim(),
			difficulty: form.difficulty,
			durationMin: form.durationMin,
			durationMax: form.durationMax,
		});
		setOpen(false);
		setForm(EMPTY_FORM);
		setError(null);
		toast.success(m["common.customScenarioAdded"]());
	}

	return (
		<div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed bg-card p-4">
			<div className="flex min-w-0 flex-col gap-0.5">
				<span className="text-sm font-semibold text-foreground">
					{m["voice.custom.title"]()}
				</span>
				<span className="text-xs text-muted-foreground">
					{m["voice.custom.body"]()}
				</span>
			</div>
			<Button
				type="button"
				variant="outline"
				className="ml-auto"
				onClick={() => setOpen(true)}
			>
				<Plus data-icon="inline-start" />
				{m["voice.custom.cta"]()}
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{m["voice.custom.dialogTitle"]()}</DialogTitle>
						<DialogDescription>
							{m["voice.custom.dialogBody"]()}
						</DialogDescription>
					</DialogHeader>
					<FieldGroup>
						<Field data-invalid={Boolean(error)}>
							<FieldLabel htmlFor="scenario-title">
								{m["voice.custom.titleLabel"]()}
							</FieldLabel>
							<Input
								id="scenario-title"
								value={form.title}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										title: event.target.value,
									}))
								}
							/>
						</Field>
						<Field data-invalid={Boolean(error)}>
							<FieldLabel htmlFor="scenario-objective">
								{m["voice.custom.objectiveLabel"]()}
							</FieldLabel>
							<Input
								id="scenario-objective"
								value={form.objective}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										objective: event.target.value,
									}))
								}
							/>
						</Field>
						<Field>
							<FieldLabel>{m["voice.custom.difficultyLabel"]()}</FieldLabel>
							<Select
								value={form.difficulty}
								onValueChange={(value) =>
									setForm((current) => ({
										...current,
										difficulty: value as ScenarioDifficulty,
									}))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{DIFFICULTIES.map((difficulty) => (
										<SelectItem key={difficulty} value={difficulty}>
											{difficulty}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<div className="grid gap-3 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="scenario-min">
									{m["voice.custom.minLabel"]()}
								</FieldLabel>
								<Input
									id="scenario-min"
									type="number"
									value={form.durationMin}
									onChange={(event) =>
										setForm((current) => ({
											...current,
											durationMin: Number(event.target.value),
										}))
									}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="scenario-max">
									{m["voice.custom.maxLabel"]()}
								</FieldLabel>
								<Input
									id="scenario-max"
									type="number"
									value={form.durationMax}
									onChange={(event) =>
										setForm((current) => ({
											...current,
											durationMax: Number(event.target.value),
										}))
									}
								/>
							</Field>
						</div>
						{error ? <FieldError>{error}</FieldError> : null}
					</FieldGroup>
					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => setOpen(false)}
						>
							{m["common.cancel"]()}
						</Button>
						<Button type="button" onClick={submit}>
							{m["voice.custom.add"]()}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
