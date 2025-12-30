package router

import (
	"fmt"
	"inventory-gold/internal/api/handler"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func setUpAllRoutes(app *fiber.App, inventoryHandler *handler.InventoryHandler, logger *zap.Logger) error {
	if app == nil {
		return fmt.Errorf("fiber app instance cannot be nil in setUpAllRoutes.")
	}
	if inventoryHandler == nil {
		return fmt.Errorf("inventoryHandler is nil in setUpAllRoutes.")
	}

	if err := SetupInventoryRoutes(app, inventoryHandler, logger); err != nil {
		return fmt.Errorf("failed to set up inventory routes: %w", err)
	}

	logger.Info("All routes have been set up successfully.")
	return nil
}
