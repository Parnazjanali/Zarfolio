package transactionmanager

import (
	"context"
	"gold-api/internal/model"
)

type TransactionManagerClient interface {
	GetAllTransactions(ctx context.Context) ([]model.Transaction, error)
	CreateTransaction(ctx context.Context, tx model.Transaction) (model.Transaction, error)
	GetTransactionByID(ctx context.Context, id string) (model.Transaction, error)
	UpdateTransaction(ctx context.Context, id string, tx model.Transaction) (model.Transaction, error)
	DeleteTransaction(ctx context.Context, id string) error

	BaseUrl() string
}
