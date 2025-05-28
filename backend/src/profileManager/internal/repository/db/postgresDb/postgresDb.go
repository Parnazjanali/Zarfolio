package postgresDb

import (
	"fmt"
	"log"
	"os"
	"profile-gold/internal/model"
	"profile-gold/internal/utils"
	"time"

	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Tehran",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	if os.Getenv("DB_HOST") == "" || os.Getenv("DB_USER") == "" || os.Getenv("DB_PASSWORD") == "" || os.Getenv("DB_NAME") == "" || os.Getenv("DB_PORT") == "" {
		utils.Log.Fatal("Missing one or more database environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)")
	}
	utils.Log.Info("Database DSN constructed", zap.String("host", os.Getenv("DB_HOST")), zap.String("port", os.Getenv("DB_PORT")))

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			LogLevel:                  logger.Silent,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: newLogger,
	})

	if err != nil {
		utils.Log.Fatal("Failed to connect to the PostgreSQL database", zap.Error(err))
	}

	sqlDB, err := DB.DB()
	if err != nil {
		utils.Log.Fatal("Failed to get underlying SQL DB instance from GORM", zap.Error(err))
	}

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(time.Hour)

	utils.Log.Info("PostgreSQL database connected successfully. Attempting AutoMigrate...")

	err = DB.AutoMigrate(&model.User{})
	if err != nil {
		utils.Log.Fatal("Failed to auto migrate database schema for User model", zap.Error(err))
	}
	utils.Log.Info("Database auto-migration completed successfully for User model.")

}
