package models

import (
	"time"
)

type UserRole string

const (
	UserRoleAdmin UserRole = "admin"
	UserRoleUser  UserRole = "user"
	UserRoleGuest UserRole = "guest"
)

type User struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	Name      string    `gorm:"type:varchar(255)" json:"name"`
	UserRole  UserRole  `gorm:"type:varchar(255);not null;default:user" json:"-"`
	AvatarURL string    `gorm:"type:varchar(500)" json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
}

func (User) TableName() string {
	return "users"
}
