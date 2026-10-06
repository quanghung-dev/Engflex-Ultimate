package requests

// CreateVocabularyDeck creates a user-owned flashcard deck.
type CreateVocabularyDeck struct {
	CategoryID   *string `json:"categoryId" binding:"omitempty,uuid"`
	Name         string  `json:"name" binding:"required,max=200"`
	Description  string  `json:"description"`
	ThumbnailURL string  `json:"thumbnailUrl"`
	Level        string  `json:"level"`
}

// UpdateVocabularyDeck renames or re-categorises a deck.
type UpdateVocabularyDeck struct {
	CategoryID   *string `json:"categoryId" binding:"omitempty,uuid"`
	Name         *string `json:"name" binding:"omitempty,max=200"`
	Description  *string `json:"description"`
	ThumbnailURL *string `json:"thumbnailUrl"`
	Level        *string `json:"level"`
}

// CreateVocabularyDeckItem adds one flashcard row to a deck.
type CreateVocabularyDeckItem struct {
	DeckID            string  `json:"deckId" binding:"required,uuid"`
	VideoExerciseID   *string `json:"videoExerciseId" binding:"omitempty,uuid"`
	VideoTranscriptID *string `json:"videoTranscriptId" binding:"omitempty,uuid"`
	Phrase            string  `json:"phrase" binding:"required"`
	Meaning           string  `json:"meaning" binding:"required"`
	ExampleSentence   string  `json:"exampleSentence"`
	Note              string  `json:"note"`
}

// UpdateVocabularyDeckItem edits a flashcard row.
type UpdateVocabularyDeckItem struct {
	Phrase          *string `json:"phrase"`
	Meaning         *string `json:"meaning"`
	ExampleSentence *string `json:"exampleSentence"`
	Note            *string `json:"note"`
}

// CreateVocabularyItem adds a shared dictionary entry or a custom word.
type CreateVocabularyItem struct {
	Term       string  `json:"term" binding:"required"`
	Definition string  `json:"definition"`
	CEFR       string  `json:"cefr" binding:"required,oneof=A1 A2 B1 B2 C1 C2"`
	Domain     *string `json:"domain"`
}

// SaveUserVocabulary saves per-user state over a shared item (idempotent).
type SaveUserVocabulary struct {
	ItemID     string  `json:"itemId" binding:"required,uuid"`
	SourceType string  `json:"sourceType" binding:"required,oneof=lesson conversation manual"`
	SourceID   *string `json:"sourceId" binding:"omitempty,uuid"`
	Note       *string `json:"note"`
	Mastered   *bool   `json:"mastered"`
}
