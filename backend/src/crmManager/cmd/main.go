package main

import (
	"crm-gold/internal/api/router"
	"crm-gold/internal/repository/db/postgresDb"
	"crm-gold/internal/utils"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	if err := utils.InitLogger(); err != nil {
		panic(fmt.Errorf("failed to initialize logger: %w", err))
	}
	defer utils.Log.Sync()

	utils.Log.Info("Starting CRM Manager Service...")

	err := godotenv.Load()
	if err != nil {
		utils.Log.Fatal("Error loading .env file: %v", zap.String("error", err.Error()))
	}
	jwtSecretKey := os.Getenv("JWT_SECRET_KEY")
	utils.Log.Info("Loaded JWT_SECRET_KEY", zap.String("key", jwtSecretKey), zap.Int("length", len(jwtSecretKey)))

	if err := postgresDb.InitDB(); err != nil {
		utils.Log.Fatal("Failed to initialize database", zap.Error(err))
	}
	utils.Log.Info("Database initialized successfully.")

	crmManagerPort := os.Getenv("CRM_MANAGER_PORT")
	if crmManagerPort == "" {
		crmManagerPort = ":8082"
	}

	utils.Log.Info("CRM Manager Service attempting to start Fiber server", zap.String("port", crmManagerPort))
	if err := router.StartServer(crmManagerPort); err != nil {
		utils.Log.Fatal("CRM Manager Service failed to start Fiber server", zap.Error(err))
	}

	utils.Log.Info("CRM Manager Service started successfully on port 8082.")
}
