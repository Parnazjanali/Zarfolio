package main

import (
	"fmt"
	"os"
	"profile-gold/internal/api/router"
	"profile-gold/internal/repository/db/postgresDb"
	"profile-gold/internal/utils"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	if err := utils.InitLogger(); err != nil {
		panic(fmt.Errorf("failed to initialize logger: %w", err))
	}
	defer func() {
		if err := utils.Log.Sync(); err != nil && err.Error() != "sync /dev/stdout: invalid argument" {
			fmt.Fprintf(os.Stderr, "Failed to sync logger: %v\n", err)
		}
	}()

	if err := godotenv.Load(); err != nil {
		utils.Log.Warn("No .env file found or error loading it. Assuming environment variables are set directly.", zap.Error(err))
	}
	   jwtSecretKey := os.Getenv("JWT_SECRET_KEY")
    utils.Log.Info("Loaded JWT_SECRET_KEY", zap.String("key", jwtSecretKey), zap.Int("length", len(jwtSecretKey)))

	utils.Log.Info("Initializing database connection for Profile Manager...")
	postgresDb.InitDB()
	utils.Log.Info("Database connection established.")

	userRepo := postgresDb.NewPostgresUserRepository(postgresDb.DB)
	if userRepo == nil {
		utils.Log.Fatal("Failed to initialize UserRepository for seeding. Exiting application.")
	}

	if os.Getenv("RUN_DB_SEED") == "true" {
		utils.Log.Info("RUN_DB_SEED is true. Running database seed...")
		if err := postgresDb.SeedInitialData(postgresDb.DB); err != nil {
			utils.Log.Fatal("Database seeding failed: %v", zap.Error(err))
		}
		utils.Log.Info("Database seeding completed.")
	} else {
		utils.Log.Info("Database seeding skipped. Set RUN_DB_SEED=true to run seed.")
	}

	if err := router.StartServer(":8081"); err != nil {
		utils.Log.Fatal("Profile Manager server failed to start or encountered a fatal error.", zap.Error(err))
	}
}
