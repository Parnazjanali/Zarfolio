package handler

import (
	"fmt"
	"gold-api/internal/service/inventory"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type InventoryHandler struct {
	InventorySvc inventory.InventoryService
	logger       *zap.Logger
}

func NewInventoryHandler(inventorySvc inventory.InventoryService, logger *zap.Logger) (*InventoryHandler, error) {

	defer logger.Sync()

	if inventorySvc == nil {
		logger.Error("inventorySvc is nil in NewInventoryHandler", zap.String("service", "api-gateway"))
		return nil, fmt.Errorf("inventorySvc cannot be nil for InventoryHandler")
	}
	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for InventoryHandler")
	}

	logger.Debug("InventoryHandler initialized successfully", zap.String("service", "api-gateway"))
	return &InventoryHandler{InventorySvc: inventorySvc, logger: logger}, nil
}

func (h *InventoryHandler) CreateProduct(c *fiber.Ctx) error {
	// Implementation for creating a product
	return nil
}