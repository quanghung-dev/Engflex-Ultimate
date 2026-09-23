package enums

// VocabularySort is the API-only list sort order for the vocabulary hub.
type VocabularySort string

const (
	VocabularySortRecent   VocabularySort = "recent"
	VocabularySortMastery  VocabularySort = "mastery"
	VocabularySortAlpha    VocabularySort = "alphabetical"
	VocabularySortInterval VocabularySort = "interval"
)
