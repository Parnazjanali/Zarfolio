package postgresDb

import (
	"crm-gold/internal/model"
	"crm-gold/internal/utils"
	"fmt"
	"os"
	"time"

	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
	utils.Log.Info("Initializing database connection for Crm Manager...")

	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSSLMode := os.Getenv("DB_SSLMODE")

	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "5432"
	}
	if dbUser == "" {
		dbUser = "crm_user"
	}
	if dbPassword == "" {
		    dbPassword = "E3wgj02G?SFw" 
	}
	if dbName == "" {
		dbName = "zarfolio"
	}
	if dbSSLMode == "" {
		dbSSLMode = "disable"
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Tehran",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	utils.Log.Info("Attempting to connect to DB with DSN (excluding password)",
		zap.String("dsn_prefix", fmt.Sprintf("host=%s port=%s user=%s dbname=%s sslmode=%s", dbHost, dbPort, dbUser, dbName, dbSSLMode)))

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to connect to PostgreSQL database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get SQL DB instance: %w", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	utils.Log.Info("PostgreSQL database connected successfully. Attempting AutoMigrate...")

	err = DB.AutoMigrate(
		&model.Customer{},
		&model.CusCard{},
		&model.CusType{},
		&model.Currency{},
		&model.PaymentTerm{},
		&model.Employee{},
		&model.PersonPrelabel{},
	)

	if err != nil {
		return fmt.Errorf("failed to auto-migrate database schemas: %w", err)
	}
	utils.Log.Info("Database schemas auto-migrated successfully.")

	return nil

}
