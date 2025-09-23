package inventory

import (
	"gold-api/internal/service/inventorymanager"

	"go.uber.org/zap"
)

type InventoryService interface {
}

type InventoryServiceImpl struct {
	logger            *zap.Logger
	inventoryManager  inventorymanager.InventoryManagerClient
}
