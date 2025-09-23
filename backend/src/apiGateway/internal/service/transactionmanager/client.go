package transactionmanager

import (
	"context"
	"fmt"
	"gold-api/internal/model"
	"net/http"
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

	return nil, nil
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
