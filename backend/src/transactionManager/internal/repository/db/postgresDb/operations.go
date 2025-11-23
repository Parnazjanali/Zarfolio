package postgresDb

import (
	"context"
	"errors"
	"fmt"
	"time"
	"transaction-gold/internal/model"
	"transaction-gold/internal/repository/repo"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type TrServiceImpl struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewTrRepository(db *gorm.DB, logger *zap.Logger) (repo.TransactionRepo, error) {
	if db == nil {
		logger.Error("database instance is nil in NewTrService.")
	}
	if logger == nil {
		return nil, errors.New("logger cannot be nil for TrService")
	}
	return &TrServiceImpl{
		db:     db,
		logger: logger,
	}, nil
}

func (r *TrServiceImpl) GetAllTransactions(ctx context.Context) ([]model.Invoice, error) {
	var invoices []model.Invoice

	r.logger.Debug("Fetching all transactions from Postgres database...")

	result := r.db.Find(&invoices)
	if result.Error != nil {
		r.logger.Error("Error fetching transactions from database.",
			zap.Error(result.Error))
		return nil, result.Error
	}

	return invoices, nil
}

func (r *TrServiceImpl) CreateGenericTransaction(ctx context.Context, invoice *model.Invoice) (*model.Invoice, error) {
	r.logger.Debug("Creating a new generic transaction in Postgres database...")

	result := r.db.Create(invoice)
	if result.Error != nil {
		r.logger.Error("Error creating generic transaction in database.",
			zap.Error(result.Error))
		return nil, result.Error
	}

	return invoice, nil
}

func (s *TrServiceImpl) calculateInvoiceTotals(invoice *model.Invoice) error {
	var grandTotal float64 = 0.0
	var totalTax float64 = 0.0
	var totalDiscount float64 = 0.0

	for i := range invoice.Items {
		item := &invoice.Items[i]

		// محاسبه TotalPrice هر آیتم
		item.TotalPrice = item.Quantity * item.UnitPrice

		// اعمال تخفیف
		if item.DiscountPercent > 0 {
			item.DiscountAmount = item.TotalPrice * (item.DiscountPercent / 100.0)
		}
		item.TotalPrice -= item.DiscountAmount

		// محاسبه مالیات
		// فرض می‌کنیم نرخ مالیات (tax rate) را از جایی دیگر دریافت می‌کنید یا در Item تعریف شده است.
		// item.TaxAmount = item.TotalPrice * TaxRate

		// جمع کل
		grandTotal += item.TotalPrice
		totalDiscount += item.DiscountAmount
		totalTax += item.TaxAmount
	}

	invoice.GrandTotal = grandTotal
	invoice.TaxAmount = totalTax
	invoice.DiscountAmount = totalDiscount

	return nil
}

func (s *TrServiceImpl) generateUniqueInvoiceNumber(ctx context.Context) (string, error) {
	// منطق پیچیده‌ای است که می‌تواند شامل:
	// الف) گرفتن آخرین شماره فاکتور از دیتابیس (با قفل Pessimistic)
	// ب) اضافه کردن 1 به آن
	// ج) فرمت کردن (مثل: 1404/000123)

	// برای سادگی، فعلاً یک نمونه ساده برمی‌گردانیم.
	// **هشدار:** این پیاده‌سازی در محیط تولید (Production) می‌تواند مشکل همزمانی (Concurrency) ایجاد کند.

	// بهتر است این منطق در ریپازیتوری یا با استفاده از ابزارهای خاص دیتابیس (مانند Sequence) پیاده‌سازی شود.

	// مثلاً:
	// lastNumber, err := s.transactionRepo.GetLastInvoiceNumber(ctx)
	// newNumber := lastNumber + 1
	// return fmt.Sprintf("INV-%d", newNumber), nil

	// یا برای تست:
	return fmt.Sprintf("INV-%d", time.Now().UnixNano()), nil
}

func (s *TrServiceImpl) GenerateUniqueInvoiceNumber(ctx context.Context) (string, error) {
	return s.generateUniqueInvoiceNumber(ctx)
}

func (s *TrServiceImpl) CalculateInvoiceTotals(invoice *model.Invoice) error {
	return s.calculateInvoiceTotals(invoice)
}