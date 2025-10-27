package transactionmanager

import (
	"context"
	"gold-api/internal/model"
)

type TransactionManagerClient interface {
	GetAllTransactions(ctx context.Context) ([]model.Invoice, error)
	CreateTransaction(ctx context.Context, tx model.CreateInvoiceRequest, userId string) (model.Invoice, error)
	GetTransactionByID(ctx context.Context, id string) (model.Invoice, error)
	UpdateTransaction(ctx context.Context, id string, tx model.Invoice) (model.Invoice, error)
	DeleteTransaction(ctx context.Context, id string) error

	BaseUrl() string
}
