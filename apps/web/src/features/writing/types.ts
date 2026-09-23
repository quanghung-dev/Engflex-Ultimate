/** mock-only: no contract type yet — instant linguistic feedback card. */
export interface WritingFeedbackRow {
	kind: "Grammar" | "Vocabulary" | "Naturalness";
	tone: "warning" | "accuracy" | "violet";
	body: string;
}

export interface WritingFeedback {
	/** CEFR tier code, e.g. "B1" — the "checked" badge copy is localized. */
	cefrLevel: string;
	rows: WritingFeedbackRow[];
}
