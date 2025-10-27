package postgresDb

import (
    "fmt"
    "time"
    "transaction-gold/internal/model"

    "go.uber.org/zap"
    "gorm.io/gorm"
)

func seedDB(db *gorm.DB, logger *zap.Logger) error {
    if db == nil {
        logger.Error("Database connection is nil", zap.String("operation", "seedDB"))
        return fmt.Errorf("database connection cannot be nil")
    }
    if logger == nil {
        logger.Error("Logger is nil", zap.String("operation", "seedDB"))
        return fmt.Errorf("logger cannot be nil")
    }

    logger.Info("Seeding initial data into the database...",
        zap.String("service", "database"),
        zap.String("component", "transactions"),
        zap.String("operation", "seedDB"))

    var count int64
    if err := db.Model(&model.Invoice{}).Count(&count).Error; err != nil {
        logger.Error("Failed to count existing invoices",
            zap.String("service", "database"),
            zap.String("component", "transactions"),
            zap.String("operation", "seedDB"),
            zap.Error(err))
        return err
    }
    if count > 0 {
        logger.Info("Invoices already exist, skipping seeding.",
            zap.String("service", "database"),
            zap.String("component", "transactions"),
            zap.String("operation", "seedDB"))
        return nil
    }

    invoices := []model.Invoice{
        {
            ID:            "inv-001",
            InvoiceNumber: "INV-001",
            CustomerID:    "cust-001",
            CustomerName:  "John Doe",
            InvoiceDate:   time.Now().AddDate(0, -1, 0),
            FlowType:      "receivable",
            DocumentSubType: "sale_invoice",
            GrandTotal:    400.0, 
            Currency:      "IRR",
            Status:        "pending",
            CreatedAt:     time.Now(),
            UpdatedAt:     time.Now(),
            Items: []model.InvoiceItem{
                {
                    ID:          "item-001",
                    InvoiceID:   "inv-001", 
                    Type:        "generic", 
                    Description: "Item 1",
                    Quantity:    1,
                    UnitPrice:   100.0,
                    TotalPrice:  100.0,
                },
                {
                    ID:          "item-002",
                    InvoiceID:   "inv-001", 
                    Type:        "generic", 
                    Description: "Item 2",
                    Quantity:    2,
                    UnitPrice:   150.0,
                    TotalPrice:  300.0,
                },
            },
        },
    }

    if err := db.Create(&invoices).Error; err != nil {
        logger.Error("Failed to seed initial invoices",
            zap.String("service", "database"),
            zap.String("component", "transactions"),
            zap.String("operation", "seedDB"),
            zap.Error(err))
        return err
    }

    logger.Info("Initial data seeded successfully",
        zap.String("service", "database"),
        zap.String("component", "transactions"),
        zap.String("operation", "seedDB"))

    return nil
}