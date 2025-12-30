package inventoryService

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"transaction-gold/internal/model"

	"go.uber.org/zap"
)

type InventoryHTTPClient struct {
	baseURL string 
	client  *http.Client
	logger  *zap.Logger
}

func NewInventoryManagerClient(baseURL string, logger *zap.Logger) (InventoryServiceClient, error) {
	if baseURL == "" {
		logger.Error("InventoryManagerClient base URL is empty",
			zap.String("service", "inventory-manager"))
		return nil, fmt.Errorf("InventoryManagerClient base URL cannot be empty")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger is nil")
	}

	concreteClient := &InventoryHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
		logger:  logger,
	}
	return concreteClient, nil
}

func (c *InventoryHTTPClient) BaseUrl() string {
	return c.baseURL
}

func (c *InventoryHTTPClient) DecreaseStock(ctx context.Context, items []model.StockChangeItem) error {
	url := fmt.Sprintf("%s/api/v1/inventory/decrease", c.baseURL)

	// ۱. تبدیل داده‌ها به فرمت JSON
	jsonData, err := json.Marshal(items)
	if err != nil {
		return fmt.Errorf("failed to marshal stock items: %w", err)
	}

	// ۲. ایجاد Request با Context (برای رعایت Timeout)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// ۳. افزودن هدرها (مهم برای Idempotency)
	req.Header.Set("Content-Type", "application/json")
	// اگر InvoiceID را داشته باشیم، اینجا به عنوان کلید یکتا می‌فرستیم
	// req.Header.Set("X-Request-ID", items[0].InvoiceID)

	// ۴. ارسال درخواست با مکانیزم Retry ساده
	var resp *http.Response
	for i := 0; i < 3; i++ { // ۳ بار تلاش مجدد در صورت خطای شبکه
		resp, err = c.client.Do(req)
		if err == nil {
			break
		}
		c.logger.Warn("Retry sending request to inventory", zap.Int("attempt", i+1), zap.Error(err))
		time.Sleep(time.Second * 1) 
	}

	if err != nil {
		return fmt.Errorf("inventory service unavailable after retries: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {

		return fmt.Errorf("inventory service returned error: status %d", resp.StatusCode)
	}

	c.logger.Info("Stock decreased successfully in inventory service")
	return nil
}
func (c *InventoryHTTPClient) IncreaseStock(ctx context.Context, items []model.StockChangeItem) error {

	return nil
}
