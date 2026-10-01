package models

type Category struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
}

func (Category) TableName() string {
	return "categories"
}
