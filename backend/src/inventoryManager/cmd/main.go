package main

import (
	"fmt"
	"inventory-gold/internal/api/router"
	"os"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {

	logger, err := zap.NewDevelopment()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	if err := godotenv.Load(); err != nil {
		logger.Warn("Failed to load .env file, using default env vars",
			zap.String("service", "main"),
			zap.String("operation", "load-env"),
			zap.Error(err))
	}

		jwtSecretKey := os.Getenv("JWT_SECRET_KEY")
	if jwtSecretKey == "" {
		logger.Error("JWT_SECRET_KEY is not set",
			zap.String("service", "main"),
			zap.String("operation", "validate-env"))
		fmt.Fprintf(os.Stderr, "JWT_SECRET_KEY is required\n")
		os.Exit(1)
	}

	/*if err := postgresDb.InitDB(logger); err != nil {
		logger.Error("Failed to initialize database",
			zap.Error(err))
		panic(err)
	}*/

	InventoryManagerPort := os.Getenv("Inventory_Manager_Port")
	if InventoryManagerPort == "" {
		InventoryManagerPort = ":8084"
		logger.Warn("Inventory_Manager_Port not set, using default",
			zap.String("default_port", InventoryManagerPort),
			zap.String("service", "main"),
			zap.String("operation", "validate-env"))
	}

	if err := router.StartServer(InventoryManagerPort, logger); err != nil {
		logger.Error("Failed to start server",
			zap.String("service", "main"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		fmt.Fprintf(os.Stderr, "Failed to start server: %v\n", err)
		os.Exit(1)
	}

	logger.Info("Application started successfully")
}

