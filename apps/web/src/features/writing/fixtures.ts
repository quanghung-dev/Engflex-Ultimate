import type { WritingFeedback } from "./types";

/** Verbatim from engflex_writing_practice_clean_minimal. */
export const WRITING_FEEDBACK: WritingFeedback = {
	cefrLevel: "B1",
	rows: [
		{
			kind: "Grammar",
			tone: "warning",
			body: "2 minor adjustments suggested: Consider adding a comma before dependent clauses to enhance sentence rhythm.",
		},
		{
			kind: "Vocabulary",
			tone: "accuracy",
			body: 'Good use of "responsible for" and "intuitive interfaces".',
		},
		{
			kind: "Naturalness",
			tone: "violet",
			body: 'Try using "I mainly deal with" for day-to-day routine tasks to sound even more natural in professional conversation.',
		},
	],
};

/** The mock's own draft, used to seed the editor (46 words). */
export const WRITING_SAMPLE_TEXT =
	"I am a product designer at a technology company. I am responsible for designing intuitive web interfaces and conducting user research interviews. Currently, I am working on a real-time feedback component to help global professionals practice workplace negotiations with greater confidence.";
