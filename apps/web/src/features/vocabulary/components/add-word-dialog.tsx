import type { CEFR } from "@engflex/contracts";
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
import { Textarea } from "#/components/ui/textarea";
import { addCustomWord } from "#/features/vocabulary/store";
import { m } from "#/paraglide/messages";

const CEFR_OPTIONS: Array<{ value: CEFR; label: () => string }> = [
	{ value: "B1", label: () => m["vocabulary.addWord.cefrOptions.B1"]() },
	{ value: "B2", label: () => m["vocabulary.addWord.cefrOptions.B2"]() },
	{ value: "C1", label: () => m["vocabulary.addWord.cefrOptions.C1"]() },
];

const POS_OPTIONS = ["noun", "verb", "adj", "idiom / phrase"];

const EMPTY_FORM = {
	term: "",
	cefr: "B2" as CEFR,
	partOfSpeech: "noun",
	definition: "",
	example: "",
};

export function AddWordDialog() {
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);
	const [error, setError] = useState<string | null>(null);

	function submit() {
		if (!form.term.trim() || !form.definition.trim()) {
			setError(m["vocabulary.addWord.required"]());
			return;
		}
		addCustomWord({
			term: form.term.trim(),
			cefr: form.cefr,
			partOfSpeech: form.partOfSpeech,
			definition: form.definition.trim(),
			example: form.example.trim(),
		});
		toast.success(m["common.addedToVocabulary"]());
		setOpen(false);
		setForm(EMPTY_FORM);
		setError(null);
	}

	return (
		<>
			<Button type="button" onClick={() => setOpen(true)}>
				<Plus data-icon="inline-start" />
				{m["vocabulary.addWord.button"]()}
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{m["vocabulary.addWord.title"]()}</DialogTitle>
						<DialogDescription>
							{m["vocabulary.addWord.description"]()}
						</DialogDescription>
					</DialogHeader>
					<FieldGroup>
						<Field data-invalid={Boolean(error)}>
							<FieldLabel htmlFor="word-term">
								{m["vocabulary.addWord.termLabel"]()}
							</FieldLabel>
							<Input
								id="word-term"
								value={form.term}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										term: event.target.value,
									}))
								}
							/>
						</Field>
						<div className="grid gap-3 sm:grid-cols-2">
							<Field>
								<FieldLabel>{m["vocabulary.addWord.cefrLabel"]()}</FieldLabel>
								<Select
									value={form.cefr}
									onValueChange={(value) =>
										setForm((current) => ({ ...current, cefr: value as CEFR }))
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CEFR_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
							<Field>
								<FieldLabel>{m["vocabulary.addWord.posLabel"]()}</FieldLabel>
								<Select
									value={form.partOfSpeech}
									onValueChange={(value) =>
										setForm((current) => ({
											...current,
											partOfSpeech: value,
										}))
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{POS_OPTIONS.map((pos) => (
											<SelectItem key={pos} value={pos}>
												{pos}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						</div>
						<Field data-invalid={Boolean(error)}>
							<FieldLabel htmlFor="word-definition">
								{m["vocabulary.addWord.definitionLabel"]()}
							</FieldLabel>
							<Textarea
								id="word-definition"
								rows={2}
								value={form.definition}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										definition: event.target.value,
									}))
								}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="word-example">
								{m["vocabulary.addWord.exampleLabel"]()}
							</FieldLabel>
							<Textarea
								id="word-example"
								rows={2}
								value={form.example}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										example: event.target.value,
									}))
								}
							/>
						</Field>
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
							{m["vocabulary.addWord.save"]()}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
