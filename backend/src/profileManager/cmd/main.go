package main

import (
	"fmt"
	"os"
	"profile-gold/internal/api/server"
	"profile-gold/internal/repository/db/postgresDb"
	"profile-gold/internal/utils"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	if err := godotenv.Load(); err != nil {
		utils.Log.Warn("No .env file found or error loading it. Assuming environment variables are set directly.", zap.Error(err))
	}

	if err := utils.InitLogger(); err != nil {
		panic(fmt.Errorf("failed to initialize logger: %w", err))
	}
	defer func() {
		if err := utils.Log.Sync(); err != nil && err.Error() != "sync /dev/stdout: invalid argument" {

			fmt.Fprintf(os.Stderr, "Failed to sync logger: %v\n", err)
		}
	}()

	utils.Log.Info("Initializing database connection for Profile Manager...")
	postgresDb.InitDB()
	utils.Log.Info("Database connection established.")

	server.SeutUpServer(":8081")

}
