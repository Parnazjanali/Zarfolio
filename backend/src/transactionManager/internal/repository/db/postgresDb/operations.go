package postgresDb

import (
	"context"
	"errors"
	"transaction-gold/internal/model"
	"transaction-gold/internal/repository/repo"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type TrRepo struct {
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
	return &TrRepo{
		db:     db,
		logger: logger,
	}, nil
}

func (r *TrRepo) GetAllTransactions(ctx context.Context) ([]model.Invoice, error) {
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

func (r *TrRepo) CreateGenericTransaction(ctx context.Context, invoice *model.Invoice) (*model.Invoice, error) {
    r.logger.Info("Starting database transaction for new invoice",
        zap.String("invoice_number", invoice.InvoiceNumber))

    // استفاده از Transaction برای اطمینان از صحت ثبت والد و فرزندان با هم
    err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        
        // ۱. ثبت فاکتور و آیتم‌های همراه آن
        // GORM به صورت خودکار InvoiceItemها را چون در فیلد Items هستند ذخیره می‌کند
        if err := tx.Create(invoice).Error; err != nil {
            r.logger.Error("Failed to create invoice and items", zap.Error(err))
            return err
        }

        // ۲. اینجا می‌توانید لاجیک‌های دیتابیسی دیگر مثل آپدیت موجودی انبار کالا (Commodity)
        // را هم اضافه کنید که اگر یکی شکست خورد، کل فاکتور Rollback شود.

        return nil
    })

    if err != nil {
        return nil, err
    }

    return invoice, nil
}

func (r *TrRepo) GetLastInvoiceSerialNumber(ctx context.Context) (int, error) {
    var lastNumber *int 
    
    err := r.db.WithContext(ctx).
        Table("invoices").
        Select("COALESCE(MAX(serial_number), 0)"). 
        Row().
        Scan(&lastNumber)

    if err != nil {
        return 0, err
    }
    if lastNumber == nil {
        return 0, nil
    }
    return *lastNumber, nil
}

func (r *TrRepo) UpdateInvoiceStatus(ctx context.Context, id string, status string) error {
    // آپدیت کردن فقط یک فیلد خاص (status) برای فاکتور مورد نظر
    result := r.db.WithContext(ctx).
        Model(&model.Invoice{}).
        Where("id = ?", id).
        Update("status", status)

    if result.Error != nil {
        r.logger.Error("Failed to update invoice status", 
            zap.String("invoice_id", id), 
            zap.String("status", status), 
            zap.Error(result.Error))
        return result.Error
    }
    
    return nil
}

