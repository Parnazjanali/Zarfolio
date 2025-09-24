package transactionmanager

import (
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

func (c *TransactionManagerHTTPClient) GetAllTransactions(ctx context.Context) ([]model.Transaction, error) {
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

	respBody , err := io.ReadAll(resp.Body)
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

	var transactions []model.Transaction
	if err:= json.Unmarshal(respBody, &transactions); err != nil {
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


func (c *TransactionManagerHTTPClient) CreateTransaction(ctx context.Context, tx model.Transaction) (model.Transaction, error) {
	// Implementation for creating a transaction
	return model.Transaction{}, nil
}

func (c *TransactionManagerHTTPClient) GetTransactionByID(ctx context.Context, id string) (model.Transaction, error) {
	// Implementation for getting a transaction by ID
	return model.Transaction{}, nil
}

func (c *TransactionManagerHTTPClient) UpdateTransaction(ctx context.Context, id string, tx model.Transaction) (model.Transaction, error) {
	// Implementation for updating a transaction
	return model.Transaction{}, nil
}

func (c *TransactionManagerHTTPClient) DeleteTransaction(ctx context.Context, id string) error {
	// Implementation for deleting a transaction
	return nil
}
