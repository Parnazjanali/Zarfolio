package transactionmanager

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	"io"
	"net/http"
	"os"
	"syscall"
	"time"

	"go.uber.org/zap"
)

type TransactionManagerHTTPClient struct {
	baseURL string
	client  *http.Client
	logger  *zap.Logger
}

func NewTransactionManagerClient(baseURL string, logger *zap.Logger) (TransactionManagerClient, error) {
	if baseURL == "" {
		logger.Error("TransactionManagerClient base URL is empty",
			zap.String("service", "transaction-manager"))
		return nil, fmt.Errorf("TransactionManagerClient base URL cannot be empty")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger is nil")
	}

	concreteClient := &TransactionManagerHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
		logger:  logger,
	}
	return concreteClient, nil
}

func (c *TransactionManagerHTTPClient) BaseUrl() string {
	return c.baseURL
}

func (c *TransactionManagerHTTPClient) GetAllTransactions(ctx context.Context) ([]model.Invoice, error) {
	defer c.logger.Sync()

	if c.baseURL == "" {
		c.logger.Error("TransactionManagerClient base URL is empty",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "GetAllTransactions"))
		return nil, fmt.Errorf("TransactionManagerClient base URL cannot be empty")
	}

	targetURL := c.baseURL + "/tr/transactions"

	httpReq, err := http.NewRequest(http.MethodGet, targetURL, nil)
	if err != nil {
		c.logger.Error("Failed to create HTTP request",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "GetAllTransactions"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	token, ok := ctx.Value("userToken").(string)
	if !ok || token == "" {
		c.logger.Error("User token not found in context",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "GetAllTransactions"))
		return nil, fmt.Errorf("user token not found in context")
	}

	httpReq.Header.Set("Authorization", "Bearer "+token)

	internalServiceSecret := os.Getenv("TRANSACTION_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		c.logger.Error("TRANSACTION_MANAGER_SERVICE_SECRET environment variable is not set",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "GetAllTransactions"))
		return nil, fmt.Errorf("TRANSACTION_MANAGER_SERVICE_SECRET environment variable is not set")
	}

	resp, err := c.client.Do(httpReq.WithContext(ctx))
	if err != nil {
		c.logger.Error("HTTP request to Transaction Manager failed",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "GetAllTransactions"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return nil, fmt.Errorf("%w: timeout connecting to Transaction Manager service at %s", service.ErrTransactionManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: connection refused to Transaction Manager service at %s", service.ErrTransactionManagerDown, c.baseURL)
		}
		return nil, fmt.Errorf("failed to send Get Customers request to Transaction Manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read response body from Transaction Manager",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "GetAllTransactions"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr != nil {
			c.logger.Error("TransactionManager returned error response for Get all Transactions request",
				zap.String("service", "transaction-manager"),
				zap.String("operation", "GetAllTransactions"),
				zap.Int("status_code", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return nil, fmt.Errorf("transaction manager returned status %d: %s", resp.StatusCode, string(respBody))
		}
		c.logger.Error(" TransactionManager returned unexpected status for Get all Transactions request",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "GetAllTransactions"),
			zap.Int("status_code", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("transaction manager get all transactions returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var transactions []model.Invoice
	if err := json.Unmarshal(respBody, &transactions); err != nil {
		c.logger.Error("Failed to unmarshal transactions from response body",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "GetAllTransactions"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to unmarshal transactions: %w", err)
	}
	c.logger.Debug("transactions retrieved successfully",
		zap.String("service", "transaction-manager"),
		zap.String("operation", "GetAllTransactions"),
		zap.Int("transaction_count", len(transactions)))
	return transactions, nil
}

func (c *TransactionManagerHTTPClient) CreateTransaction(ctx context.Context, tx model.CreateInvoiceRequest, userId string) (model.Invoice, error) {
	// 1. لاگ‌برداری و بررسی URL پایه
	c.logger.Debug("Attempting to create transaction",
		zap.String("user_id", userId))

	if c.baseURL == "" {
		c.logger.Error("TransactionManagerClient base URL is empty",
			zap.String("service", "transaction-manager-client"))
		return model.Invoice{}, fmt.Errorf("TransactionManagerClient base URL cannot be empty")
	}

	targetURL := c.baseURL + "/tr/transactions"

	// 2. آماده‌سازی بدنه درخواست (JSON)
	body, err := json.Marshal(tx)
	if err != nil {
		c.logger.Error("Failed to marshal request body", zap.Error(err))
		return model.Invoice{}, fmt.Errorf("failed to encode transaction request: %w", err)
	}

	// 3. ایجاد درخواست HTTP
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create HTTP request", zap.Error(err))
		return model.Invoice{}, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// 4. تنظیم هدرها
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-User-ID", userId) // ارسال userID به عنوان هدر در صورت نیاز

	// 5. ارسال درخواست
	resp, err := c.client.Do(req)
	if err != nil {
		c.logger.Error("Failed to send HTTP request to Transaction Manager",
			zap.String("url", targetURL),
			zap.Error(err))
		// در صورت خطای شبکه/اتصال، یک خطای مشخص برگردانید
		return model.Invoice{}, service.ErrTransactionManagerDown
	}
	defer resp.Body.Close()

	// 6. بررسی کدهای وضعیت HTTP
	if resp.StatusCode != http.StatusCreated {
		// لاگ و خواندن بدنه خطا برای اطلاعات بیشتر
		errorBody, _ := io.ReadAll(resp.Body)
		errorMessage := fmt.Sprintf("Transaction Manager returned non-201 status: %d. Body: %s", resp.StatusCode, string(errorBody))

		c.logger.Error("Transaction creation failed on Transaction Manager",
			zap.Int("status_code", resp.StatusCode),
			zap.String("response_body", string(errorBody)))

		if resp.StatusCode == http.StatusConflict {
			return model.Invoice{}, errors.New("transaction already exists or duplicate key")
		}

		// برگرداندن یک خطای عمومی یا خطای خاص بر اساس کد وضعیت
		return model.Invoice{}, errors.New(errorMessage)
	}

	// 7. تجزیه پاسخ موفق (201 Created)
	var invoice model.Invoice
	if err := json.NewDecoder(resp.Body).Decode(&invoice); err != nil {
		c.logger.Error("Failed to decode successful response body", zap.Error(err))
		return model.Invoice{}, fmt.Errorf("failed to decode successful response: %w", err)
	}

	c.logger.Info("Transaction successfully created by Transaction Manager",
		zap.String("invoice_id", invoice.ID))
	return invoice, nil
}
func (c *TransactionManagerHTTPClient) GetTransactionByID(ctx context.Context, id string) (model.Invoice, error) {
	// Implementation for getting a transaction by ID
	return model.Invoice{}, nil
}

func (c *TransactionManagerHTTPClient) UpdateTransaction(ctx context.Context, id string, tx model.Invoice) (model.Invoice, error) {
	// Implementation for updating a transaction
	return model.Invoice{}, nil
}

func (c *TransactionManagerHTTPClient) DeleteTransaction(ctx context.Context, id string) error {
	// Implementation for deleting a transaction
	return nil
}
