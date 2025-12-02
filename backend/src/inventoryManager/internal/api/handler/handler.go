package handler

import (
	InventoryService "inventory-gold/internal/service"

	"go.uber.org/zap"
)

type InventoryHandler struct {
	invSvc InventoryService.InventoryService
	logger *zap.Logger
}
