package enums

// CEFR is the international proficiency standard used by lessons,
// vocabulary items, and personas (lessons.cefr_level,
// vocabulary_items.cefr, personas.default_cefr). Display labels and colors
// are frontend copy; "B1+" is a product half-step handled by
// ScenarioDifficulty.
type CEFR string

const (
	CEFRA1 CEFR = "A1"
	CEFRA2 CEFR = "A2"
	CEFRB1 CEFR = "B1"
	CEFRB2 CEFR = "B2"
	CEFRC1 CEFR = "C1"
	CEFRC2 CEFR = "C2"
)
