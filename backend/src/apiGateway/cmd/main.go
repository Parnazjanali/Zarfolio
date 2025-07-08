package main

import (
	"fmt"
	server "gold-api/internal/api/router"
	"gold-api/internal/utils"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {

	if err := godotenv.Load(); err != nil {

		utils.Log.Warn("Error loading .env file (this is fine if env vars are set directly)", zap.Error(err))
	}

	if err := utils.InitLogger(); err != nil {
		panic(fmt.Errorf("failed to initialize logger: %w", err))
	}
	defer utils.Log.Sync()

	server.StartServer(":8080")
}
