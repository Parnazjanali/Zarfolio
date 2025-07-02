package main

import (
	"fmt"
	"os"
	"profile-gold/internal/api/server"
	"profile-gold/internal/repository"
	"profile-gold/internal/repository/db/postgresDb"
	"profile-gold/internal/service"
	"profile-gold/internal/utils"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	// ۱. راه‌اندازی لاگر
	if err := utils.InitLogger(); err != nil {
		panic(fmt.Errorf("failed to initialize logger: %w", err))
	}
	defer func() {
		if err := utils.Log.Sync(); err != nil && err.Error() != "sync /dev/stdout: invalid argument" {
			fmt.Fprintf(os.Stderr, "Failed to sync logger: %v\n", err)
		}
	}()

	// ۲. راه‌اندازی کلید JWT (بعد از لاگر)
	// ✅ **اصلاح اصلی:** تابع جدید را در اینجا صدا می‌زنیم
	utils.InitJWT()

	// ۳. بارگذاری متغیرهای محیطی
	if err := godotenv.Load(); err != nil {
		utils.Log.Warn("No .env file found or error loading it. Assuming environment variables are set directly.", zap.Error(err))
	}

	// ۴. راه‌اندازی سایر بخش‌ها...
	utils.Log.Info("Initializing database connection for Profile Manager...")
	postgresDb.InitDB()
	utils.Log.Info("Database connection established.")

	utils.Log.Info("Initializing Redis connection for Profile Manager...")
	if err := service.InitRedis(); err != nil {
		utils.Log.Fatal("Failed to initialize Redis", zap.Error(err))
	}
	utils.Log.Info("Redis connection established.")

	redisServiceInstance, err := service.NewRedisService(service.GetClient(), utils.Log)
	if err != nil {
		utils.Log.Fatal("Failed to create RedisService instance", zap.Error(err))
	}
	utils.Log.Info("RedisService instance created.")

	userRepo := postgresDb.NewPostgresUserRepository(postgresDb.DB)
	if userRepo == nil {
		utils.Log.Fatal("Failed to initialize UserRepository. Exiting application.")
	}
	counterpartyRepo := repository.NewGormCounterpartyRepository(postgresDb.DB)
	if counterpartyRepo == nil {
		utils.Log.Fatal("Failed to initialize CounterpartyRepository. Exiting application.")
	}
	utils.Log.Info("Repositories initialized.")

	counterpartyService := service.NewCounterpartyService(counterpartyRepo, utils.Log)
	if counterpartyService == nil {
		utils.Log.Fatal("Failed to initialize CounterpartyService. Exiting application.")
	}
	utils.Log.Info("CounterpartyService initialized.")

	if os.Getenv("RUN_DB_SEED") == "true" {
		utils.Log.Info("RUN_DB_SEED is true. Running database seed...")
		if err := postgresDb.SeedAdminUser(postgresDb.DB); err != nil {
			utils.Log.Fatal("Database seeding failed", zap.Error(err)) //
		}
		utils.Log.Info("Database seeding completed.")
	} else {
		utils.Log.Info("Database seeding skipped. Set RUN_DB_SEED=true to run seed.")
	}

	server.StartServer(":8081", redisServiceInstance, counterpartyService)
}