package handler

import (
	"fmt"
	inventoryService "inventory-gold/internal/service/inventory"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type InventoryHandler struct {
	invSvc inventoryService.InventoryService
	logger *zap.Logger
}

func NewInventoryHandler(invSvc inventoryService.InventoryService, logger *zap.Logger) (*InventoryHandler, error) {
	defer logger.Sync()
	if invSvc == nil {
		logger.Error("inventory service is nil in NewInventoryHandler.",
			zap.String("service", "inventory"),
			zap.String("operation", "Get-all-inventory"))
	}
	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for InventoryHandler")
	}

	logger.Debug("Initializing InventoryHandler...",
		zap.String("service", "inventory"),
		zap.String("operation", "NewInventoryHandler"))

	return &InventoryHandler{invSvc: invSvc,
		logger: logger,
	}, nil

}

func (h *InventoryHandler) HandleDecreaseStock(c *fiber.Ctx) error {
	/*var req []model.StockChangeRequest

	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse stock decrease request", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	// ارسال به لایه سرویس برای بررسی منطق بیزینس و دیتابیس
	if err := h.invSvc.ProcessDecrease(c.Context(), req); err != nil {
		h.logger.Error("Failed to decrease stock", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success"})*/
	return nil
}

func (h *InventoryHandler) HandleIncreaseStock(c *fiber.Ctx) error {
	/*var req []model.StockChangeRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	if err := h.invSvc.ProcessIncrease(c.Context(), req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success"})*/
	return nil
}
