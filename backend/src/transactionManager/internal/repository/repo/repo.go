package repo

import (
	"context"
	"transaction-gold/internal/model"

)

type TransactionRepo interface {
	GetAllTransactions(ctx context.Context) ([]model.Invoice, error)	
	CreateGenericTransaction(ctx context.Context, invoice *model.Invoice) (*model.Invoice, error)
	GetLastInvoiceSerialNumber(ctx context.Context) (int, error)
	UpdateInvoiceStatus(ctx context.Context, id string, status string) error




}
