package inventoryService
import (
	"context"
	"transaction-gold/internal/model"
)

type InventoryServiceClient interface {
	DecreaseStock(ctx context.Context, items []model.StockChangeItem) error
	IncreaseStock(ctx context.Context, items []model.StockChangeItem) error
	BaseUrl() string
}
