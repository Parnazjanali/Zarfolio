package router

import (
	"fmt"
	"inventory-gold/internal/api/handler"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetupInventoryRoutes(app *fiber.App, inventoryHandler *handler.InventoryHandler, logger *zap.Logger) error {
	if app == nil {
		return fmt.Errorf("fiber app instance cannot be nil in TransactionManager.")
	}
	if inventoryHandler == nil {
		return fmt.Errorf("transactionHandler is nil in TransactionManager's SetUpTransactionRoutes.")
	}

	transactionGroup := app.Group("/inventory")
	logger.Info("Setting up Inventory routes...")

	// تعریف اندپوینت‌ها
	transactionGroup.Post("/decrease", inventoryHandler.HandleDecreaseStock)
	transactionGroup.Post("/increase", inventoryHandler.HandleIncreaseStock)
	/*transactionGroup.Post("/commodities", inventoryHandler.CreateCommodity)

	// مشاهده موجودی یک کالای خاص
	transactionGroup.Get("/commodities/:id", inventoryHandler.GetStock)

	// گزارش کاردکس (تاریخچه تغییرات یک کالا)
	transactionGroup.Get("/commodities/:id/logs", inventoryHandler.GetStockLogs)*/

	logger.Info("Inventory routes set up successfully.")

	return nil
}
