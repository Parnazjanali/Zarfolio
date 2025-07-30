package main

import (
	"crm-gold/internal/api/router"
	"crm-gold/internal/repository/db/postgresDb"
	"crm-gold/internal/utils"
	"fmt"

	"go.uber.org/zap"
)

func main() {
	if err := utils.InitLogger(); err != nil {
		panic(fmt.Errorf("failed to initialize logger: %w", err))
	}
	defer utils.Log.Sync()

	utils.Log.Info("Starting CRM Manager Service...")

	if err := postgresDb.InitDB(); err != nil {
		utils.Log.Fatal("Failed to initialize database", zap.Error(err))
	}
	utils.Log.Info("Database initialized successfully.")

	if err := router.StartServer(":8082"); err != nil {
		utils.Log.Fatal("Profile Manager server failed to start or encountered a fatal error.", zap.Error(err))
	}
	utils.Log.Info("CRM Manager Service started successfully on port 8082.")
}
