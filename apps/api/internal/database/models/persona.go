package models

import (
	"time"

	"github.com/gianghp123/engflex-ultimate/internal/common/enums"
)

// Persona is an AI conversation partner ("Sarah", Hiring director).
// The display name is joined onto turns via scenario -> persona.
type Persona struct {
	ID          string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string      `gorm:"not null" json:"name"`
	RoleTitle   string      `gorm:"column:role_title;not null" json:"roleTitle"`
	Personality *string     `json:"personality"`
	Style       *string     `json:"style"`
	Objective   *string     `json:"objective"`
	DefaultCEFR *enums.CEFR `gorm:"column:default_cefr" json:"defaultCefr"`
	CreatedAt   time.Time   `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time   `gorm:"autoUpdateTime" json:"updatedAt"`
}

func (Persona) TableName() string { return "personas" }
