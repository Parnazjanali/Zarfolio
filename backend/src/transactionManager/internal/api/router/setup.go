package router

import (
	"fmt"
	"transaction-gold/internal/api/handler"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func setUpAllRoutes(app *fiber.App, transactionHandler *handler.TransactionHandler, logger *zap.Logger) error {
	if app == nil {
		return fmt.Errorf("fiber app instance cannot be nil in setUpAllRoutes.")
	}
	if transactionHandler == nil {
		return fmt.Errorf("transactionHandler is nil in setUpAllRoutes.")
	}

	if err := SetUpTransactionRoutes(app, transactionHandler, logger); err != nil {
		return fmt.Errorf("failed to set up transaction routes: %w", err)
	}

	logger.Info("All routes have been set up successfully.")
	return nil
}
