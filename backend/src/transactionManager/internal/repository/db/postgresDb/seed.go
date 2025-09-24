package postgresDb

import (
	"time"
	"transaction-gold/internal/model"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

func seedDB(db *gorm.DB, logger *zap.Logger) error {
	// داده‌های اولیه برای transactions
	transactions := []model.Transaction{
		{
            Code:          "tx1",
            Type:          "sale",
            PartyID:       "cust1", // باید به یک مشتری معتبر اشاره کنه
            Amount:        1000.00,
            Currency:      "IRR",
            GoldWeight:    10.5,
            Purity:        18.0,
            GoldRate:      2000.00,
            TaxAmount:     50.00,
            FeeAmount:     20.00,
            TotalAmount:   1070.00,
            Status:        "confirmed",
            InvoiceCode:   "inv1",
            PaymentMethod: "cash",
            CreatedBy:     "user1",
            ConfirmedAt:   time.Now(),
            Items: []model.Item{
                {
                    ItemID:      "item1",
                    TransactionCode: "tx1",
                    Description: "Gold ring",
                    Weight:      5.0,
                    Purity:      18.0,
                    UnitPrice:   200.00,
                    Quantity:    2,
                    TotalPrice:  400.00,
                },
            },
        },
	}

	for _, tx := range transactions {
		if err := db.Create(&tx).Error; err != nil {
			logger.Error("Failed to seed transaction",
				zap.String("transaction_code", tx.Code),
				zap.Error(err))
			return err
		}
	}
	return nil
}
