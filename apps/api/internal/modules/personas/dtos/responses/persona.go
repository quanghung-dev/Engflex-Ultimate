package responses

import "github.com/gianghp123/engflex-ultimate/internal/common/enums"

// Persona is an AI partner row (name feeds turn display names).
type Persona struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	RoleTitle   string      `json:"roleTitle"`
	Personality string      `json:"personality"`
	Style       string      `json:"style"`
	Objective   string      `json:"objective"`
	DefaultCEFR *enums.CEFR `json:"defaultCefr"`
}
