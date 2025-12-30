package postgresDb

import (
    "fmt"
    "os"
    "time"

    "transaction-gold/internal/model"

    "go.uber.org/zap"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(logger *zap.Logger) error {
    if logger == nil {
        return fmt.Errorf("logger cannot be nil in InitDB")
    }

    logger.Info("Initializing Postgres database connection for transactions...",
        zap.String("service", "database"),
        zap.String("component", "transactions"),
        zap.String("operation", "InitDB"))

    dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    dbUser := os.Getenv("DB_USER")
    dbPassword := os.Getenv("DB_PASSWORD")
    dbName := os.Getenv("DB_NAME")
    dbSSLMode := os.Getenv("DB_SSLMODE")
    dbSSLCert := os.Getenv("DB_SSLCERT")
    dbSSLKey := os.Getenv("DB_SSLKEY")
    dbSSLRootCert := os.Getenv("DB_SSLROOTCERT")

    if dbHost == "" {
        dbHost = "localhost"
        logger.Warn("DB_HOST not set, using default",
            zap.String("default_host", dbHost),
            zap.String("component", "transactions"))
    }
    if dbPort == "" {
        dbPort = "5432"
        logger.Warn("DB_PORT not set, using default",
            zap.String("default_port", dbPort),
            zap.String("component", "transactions"))
    }
    if dbUser == "" {
        dbUser = "transaction_user"
        logger.Warn("DB_USER not set, using default",
            zap.String("default_user", dbUser),
            zap.String("component", "transactions"))
    }
    if dbPassword == "" {
        logger.Error("DB_PASSWORD is empty, which is insecure",
            zap.String("component", "transactions"))
        return fmt.Errorf("DB_PASSWORD cannot be empty")
    }
    if dbName == "" {
        dbName = "zarfolio"
        logger.Warn("DB_NAME not set, using default",
            zap.String("default_db", dbName),
            zap.String("component", "transactions"))
    }
    if dbSSLMode == "" {
        dbSSLMode = "disable"
        logger.Warn("DB_SSLMODE not set, using default (insecure)",
            zap.String("default_sslmode", dbSSLMode),
            zap.String("component", "transactions"))
    }

   dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s sslcert=%s sslkey=%s sslrootcert=%s TimeZone=Asia/Tehran",
        dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode, dbSSLCert, dbSSLKey, dbSSLRootCert)

    var err error
    DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        logger.Error("Failed to connect to PostgreSQL database", zap.Error(err))
        return fmt.Errorf("failed to connect to database: %w", err)
    }

    sqlDB, _ := DB.DB()
    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(time.Hour)

    logger.Info("Attempting AutoMigrate for transaction service...")
    
    err = DB.AutoMigrate(
        &model.Invoice{},
        &model.InvoiceItem{},
        &model.PaymentSnapshot{},
    )
    if err != nil {
        logger.Error("Failed to auto-migrate database schemas", zap.Error(err))
        return fmt.Errorf("failed to auto-migrate: %w", err)
    }

    logger.Info("Database connected and schemas migrated successfully")

    return nil
}