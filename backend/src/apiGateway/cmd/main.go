package main

import (
	"fmt"
	server "gold-api/internal/api/router"
	"os"
	"strings"

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

	serverAddress := os.Getenv("SERVER_ADDRESS")
	if serverAddress == "" {
		serverAddress = ":8080"
		logger.Debug("Using default SERVER_ADDRESS",
			zap.String("service", "main"),
			zap.String("operation", "validate-env"),
			zap.String("address", serverAddress))
	} else {
		serverAddress = strings.TrimPrefix(serverAddress, "http://")
		serverAddress = strings.TrimPrefix(serverAddress, "https://")
		if !strings.Contains(serverAddress, ":") {
			logger.Error("Invalid SERVER_ADDRESS format",
				zap.String("service", "main"),
				zap.String("operation", "validate-env"),
				zap.String("address", serverAddress))
			fmt.Fprintf(os.Stderr, "SERVER_ADDRESS must be ':port' or 'host:port'\n")
			os.Exit(1)
		}
	}

	if err := server.StartServer(serverAddress, logger); err != nil {
		logger.Error("Failed to start server",
			zap.String("service", "main"),
			zap.String("operation", "start-server"),
			zap.String("address", serverAddress),
			zap.Error(err))
		fmt.Fprintf(os.Stderr, "Failed to start server: %v\n", err)
		os.Exit(1)
	}
}
