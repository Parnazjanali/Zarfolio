// backend/src/SettingsManager/internal/db/postgres.go

package db

import (
	"fmt"
	"log"
	"os"
	"zarfolio-backend/settings-manager/internal/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase initializes the database connection and runs migrations.
func InitDatabase() (*gorm.DB, error) {
	var err error
    
    // **شروع تغییرات**
    // به جای یک متغیر، از متغیرهای جداگانه استفاده می‌کنیم
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("SETTINGS_DB_NAME") // نام دیتابیس مخصوص این سرویس
    if dbname == "" {
        dbname = "zarfolio_settings_db" // مقدار پیش‌فرض اگر تعریف نشده بود
    }
	port := os.Getenv("DB_PORT")

	// بررسی اینکه آیا متغیرهای لازم تنظیم شده‌اند
	if host == "" || user == "" || dbname == "" || port == "" {
		log.Fatal("Database environment variables (DB_HOST, DB_USER, DB_PORT, SETTINGS_DB_NAME) are not set.")
	}
    
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Tehran",
		host, user, password, dbname, port,
	)
    // **پایان تغییرات**

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Printf("failed to initialize database, got error %v", err)
		return nil, fmt.Errorf("failed to connect to `user=%s database=%s`: %w", user, dbname, err)
	}

	log.Println("Database connection established.")

	err = DB.AutoMigrate(&model.SystemSettings{})
	if err != nil {
		log.Printf("Failed to auto-migrate database schema: %v\n", err)
		return nil, fmt.Errorf("failed to migrate schema: %w", err)
	}
	log.Println("Database schema migrated successfully.")

	return DB, nil
}