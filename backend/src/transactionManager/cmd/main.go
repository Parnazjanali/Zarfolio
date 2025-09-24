package main

import (
	"fmt"
	"transaction-gold/internal/repository/db/postgresDb"
	"transaction-gold/internal/utils"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Printf("Warning: Failed to load .env file: %v\n", err)
	}

	logger, err := utils.InitLogger()
	if err != nil {
		panic(fmt.Errorf("failed to initialize logger: %w", err))
	}
	defer logger.Sync()

	if err := postgresDb.InitDB(logger); err != nil {
		logger.Error("Failed to initialize database",
			zap.Error(err))
		panic(err)
	}

	logger.Info("Application started successfully")
}
