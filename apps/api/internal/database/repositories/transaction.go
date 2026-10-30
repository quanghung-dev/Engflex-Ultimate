package repositories

import (
	"context"

	"gorm.io/gorm"
)

// TransactionManager allows services to coordinate repository calls atomically.
type TransactionManager interface {
	Run(ctx context.Context, fn func(*gorm.DB) error) error
}

type transactionManager struct{ db *gorm.DB }

func NewTransactionManager(db *gorm.DB) TransactionManager { return &transactionManager{db: db} }
func (m *transactionManager) Run(ctx context.Context, fn func(*gorm.DB) error) error {
	return m.db.WithContext(ctx).Transaction(fn)
}
