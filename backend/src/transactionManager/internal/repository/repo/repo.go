package repo

import (
	"context"
	"transaction-gold/internal/model"

)

type TransactionRepo interface {
	GetAllTransactions(ctx context.Context) ([]model.Invoice, error)	
	CreateGenericTransaction(ctx context.Context, invoice *model.Invoice) (*model.Invoice, error)
	GenerateUniqueInvoiceNumber(ctx context.Context) (string, error)
	CalculateInvoiceTotals(invoice *model.Invoice) error





}
