package postgresDb

import (
	"fmt"
	"log"
	"os"
	"profile-gold/internal/utils"
	"time"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB
var dbLogger *zap.Logger

func InitDB() {
	var err error

	if err := godotenv.Load(); err != nil {
		utils.Log.Error("Error loading .env file", zap.Error(err))
	}

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
		log.New(os.Stdout, "\r\n", log.LstdFlags), // لاگ‌ها را به کنسول می‌فرستد
		logger.Config{
			LogLevel:                  logger.Silent, // سطح لاگ: Silent، Info، Warn، Error
			IgnoreRecordNotFoundError: true,          // خطاهای "رکورد یافت نشد" را لاگ نمی‌کند
			Colorful:                  true,          // لاگ‌های رنگی
		},
	)

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: newLogger, // استفاده از لاگر سفارشی GORM
		// سایر تنظیمات GORM (مثلاً Naming Strategy) را می‌توان اینجا اضافه کرد
	})

	if err != nil {
		// استفاده از لاگر Zap خودمان برای خطای اتصال به دیتابیس
		utils.Log.Fatal("Failed to connect to the database", zap.Error(err))
	}

	// 5. دریافت شیء sql.DB پایه برای تنظیمات connection pool
	sqlDB, err := DB.DB() // این خط ضروری است تا بتوانی تنظیمات connection pool را انجام دهی
	if err != nil {
		utils.Log.Fatal("Failed to get underlying SQL DB instance", zap.Error(err))
	}

	// 6. تنظیمات Connection Pool
	sqlDB.SetMaxOpenConns(10)           // حداکثر تعداد اتصال‌های باز (همزمان)
	sqlDB.SetMaxIdleConns(5)            // حداکثر تعداد اتصال‌های بیکار در Pool
	sqlDB.SetConnMaxLifetime(time.Hour) // حداکثر زمان عمر یک اتصال قبل از بسته شدن

	utils.Log.Info("PostgreSQL database connected successfully")
}
