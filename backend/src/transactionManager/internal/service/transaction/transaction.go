package transactionService

import (
	"context"
	"errors"
	"fmt"
	"time"
	"transaction-gold/internal/model"
	"transaction-gold/internal/repository/repo"
	"transaction-gold/internal/utils"

	"go.uber.org/zap"
)

type TrService interface {
	GetAllTransactions(ctx context.Context) ([]model.Invoice, error)
	CreateGenericTransaction(ctx context.Context, invoice *model.Invoice) (*model.Invoice, error)
}

type TrServiceImpl struct {
	transactionRepo repo.TransactionRepo
	logger          *zap.Logger
}

func NewTrService(trRepo repo.TransactionRepo, logger *zap.Logger) (*TrServiceImpl, error) {
	if trRepo == nil {
		logger.Error("transaction repository is nil in NewTrService.")
	}
	if logger == nil {
		return nil, errors.New("logger cannot be nil for TrService")
	}

	logger.Debug("Initializing TrService...")

	return &TrServiceImpl{
		transactionRepo: trRepo,
		logger:          logger,
	}, nil
}

func (s *TrServiceImpl) GetAllTransactions(ctx context.Context) ([]model.Invoice, error) {

	s.logger.Debug("Getting all transactions...")

	transactions, err := s.transactionRepo.GetAllTransactions(ctx)
	if err != nil {
		s.logger.Error("Failed to get all transactions from repository.")
		return nil, err
	}

	return transactions, nil
}

func (s *TrServiceImpl) CreateGenericTransaction(ctx context.Context, invoice *model.Invoice) (*model.Invoice, error) {
	s.logger.Info("Attempting to create a new generic transaction in service layer.",
		zap.String("customer_id", invoice.CustomerID),
		zap.String("flow_type", invoice.FlowType))

	if invoice.CustomerID == "" {
		return nil, errors.New("customer ID is required for the invoice")
	}
	if invoice.InvoiceDate.IsZero() {
		invoice.InvoiceDate = time.Now()
	}
	if len(invoice.Items) == 0 {
		return nil, errors.New("invoice must contain at least one item")
	}

	// 2. محاسبه‌ی مجموع مقادیر (Recalculating Totals)
	// این کار اطمینان می‌دهد که مقادیر GrandTotal بر اساس Items به درستی محاسبه شده باشند.

	// (این متد فرضی است و باید تعریف شود)
	err := s.transactionRepo.CalculateInvoiceTotals(invoice)
	if err != nil {
		s.logger.Error("Failed to calculate invoice totals.", zap.Error(err))
		return nil, fmt.Errorf("failed to calculate invoice totals: %w", err)
	}

	// 3. تولید شناسه‌های یکتا (Generating Unique IDs)

	// الف) تولید Invoice ID یکتا
	if invoice.ID == "" {
		invoice.ID = utils.GenerateUUID() // فرض می‌کنیم یک تابع GenerateUUID داریم
	}

	// ب) تولید شماره فاکتور (Invoice Number) یکتا
	if invoice.InvoiceNumber == "" {
		// (این متد فرضی است و باید تعریف شود، مشابه generateUniqueCustomerCode)
		newNumber, err := s.transactionRepo.GenerateUniqueInvoiceNumber(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to generate unique invoice number: %w", err)
		}
		invoice.InvoiceNumber = newNumber
	}

	// ج) تولید ID یکتا برای هر آیتم
	for i := range invoice.Items {
		if invoice.Items[i].ID == "" {
			invoice.Items[i].ID = utils.GenerateUUID()
		}
		// اطمینان از لینک شدن آیتم به فاکتور
		invoice.Items[i].InvoiceID = invoice.ID
	}

	// 4. به‌روزرسانی زمان‌ها و وضعیت
	invoice.Status = "pending" // یا "draft"
	invoice.CreatedAt = time.Now()
	invoice.UpdatedAt = time.Now()

	// 5. فراخوانی ریپازیتوری برای ذخیره
	createdInvoice, err := s.transactionRepo.CreateGenericTransaction(ctx, invoice)
	if err != nil {
		s.logger.Error("Failed to save new generic transaction to database.", zap.Error(err))
		// می‌توانید در اینجا خطاهای خاص (مثل تکراری بودن شماره فاکتور) را مدیریت کنید
		return nil, fmt.Errorf("failed to save transaction: %w", err)
	}

	s.logger.Info("Generic transaction created successfully in service layer.",
		zap.String("invoice_id", createdInvoice.ID),
		zap.String("invoice_number", createdInvoice.InvoiceNumber))

	// 6. سایر اقدامات پس از ثبت (مثلاً ارسال پیامک)
	if invoice.SendSMS {
		// s.SmsService.SendInvoiceNotification(ctx, createdInvoice)
	}

	return createdInvoice, nil
}
