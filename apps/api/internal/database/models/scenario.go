package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"engflex-api/internal/common/enums"
)

// Scenario is a roleplay practice card under a topic banner. A non-null
// UserID marks a user's custom scenario; MaxDuration is the fixed session
// cap in minutes; Details carries the rich detail-page content.
//
// Topic and Persona are belongs-to associations inferred from TopicID and
// PersonaID by naming convention (no tags needed). They are nil unless
// loaded with Joins — List-style reads never touch them, so existing
// mappings are unaffected. Persona stays a pointer: scenarios without one
// come back nil, not zero-valued.
type Scenario struct {
	ID          string                   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TopicID     string                   `gorm:"type:uuid;not null" json:"topicId"`
	PersonaID   *string                  `gorm:"type:uuid" json:"personaId"`
	Title       string                   `gorm:"not null" json:"title"`
	Objective   string                   `gorm:"not null;default:''" json:"objective"`
	CEFRLevel   enums.ScenarioDifficulty `gorm:"column:cefr_level;not null" json:"cefrLevel"`
	MaxDuration int                      `gorm:"column:max_duration;not null" json:"maxDuration"`
	Details     ScenarioDetail           `gorm:"type:jsonb;not null" json:"details"`
	Topic       *ScenarioTopic           `json:"topic,omitempty"`
	Persona     *Persona                 `json:"persona,omitempty"`
	UserID      *string                  `json:"userId"`
	CreatedAt   time.Time                `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time                `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Scenario) TableName() string { return "scenarios" }

// DetailOpening is the partner's first line on the detail page.
type DetailOpening struct {
	Label string `json:"label"`
	Text  string `json:"text"`
}

// ScenarioDetail is the typed view over scenarios.details (jsonb): pure
// scenario substance (context, opening line, terms). It implements
// driver.Valuer/sql.Scanner so GORM reads and writes the column directly.
type ScenarioDetail struct {
	Role             string        `json:"role"`
	InterlocutorRole string        `json:"interlocutor_role"`
	GoalFormat       string        `json:"goal_format"`
	Context          []string      `json:"context"`
	Opening          DetailOpening `json:"opening"`
	Vocab            []string      `json:"vocab"`
}

// GormDataType pins the column type for migrations handled outside GORM.
func (ScenarioDetail) GormDataType() string { return "jsonb" }

// Value marshals the detail for writes; nil slices stay null-free via
// json.Marshal defaults (nil slice encodes as null — callers treat a
// missing blob the same as an empty one).
func (d ScenarioDetail) Value() (driver.Value, error) {
	return json.Marshal(d)
}

// Scan decodes the column on reads. NULL or malformed JSON yields the zero
// value so the detail page always renders instead of failing the query.
func (d *ScenarioDetail) Scan(value any) error {
	if value == nil {
		return nil
	}
	var raw []byte
	switch v := value.(type) {
	case []byte:
		raw = v
	case string:
		raw = []byte(v)
	default:
		return nil
	}
	if len(raw) == 0 {
		return nil
	}
	if err := json.Unmarshal(raw, d); err != nil {
		*d = ScenarioDetail{}
	}
	return nil
}
