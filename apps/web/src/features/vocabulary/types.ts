import type { CEFR, VocabularyItem } from "@engflex/contracts";

/** mock-only: no contract type yet — AddWordDialog payload. */
export interface AddWordInput {
	term: string;
	cefr: CEFR;
	partOfSpeech: string;
	definition: string;
	example: string;
}

export type { VocabularyItem };
