package repo

import (
	"context"
	"transaction-gold/internal/model"

)

type TransactionRepo interface {
	GetAllTransactions(ctx context.Context) ([]model.Transaction, error)
}
