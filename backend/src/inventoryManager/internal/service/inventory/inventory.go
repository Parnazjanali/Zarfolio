package inventoryService

import (
	"inventory-gold/internal/repo"

	"go.uber.org/zap"
)

type InventoryService interface{}

type InventoryServiceImpl struct {
	inventoryRepo repo.InventoryRepo
	logger        *zap.Logger
}

func NewInventoryService(repo repo.InventoryRepo, logger *zap.Logger) (InventoryService, error) {
	// Implementation goes here
	return &InventoryServiceImpl{
		inventoryRepo: repo,
		logger:        logger,
	}, nil
}
