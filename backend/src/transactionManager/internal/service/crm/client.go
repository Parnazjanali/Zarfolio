package crmService

import (
	"context"
	"fmt"
	"net/http"
	"time"
	"transaction-gold/internal/model"

	"go.uber.org/zap"
)

type CrmSHTTPClient struct {
	baseURL string
	client  *http.Client
	logger  *zap.Logger
}

func NewCrmManagerClient(baseURL string, logger *zap.Logger) (CrmServiceClient, error) {
	if baseURL == "" {
		logger.Error("CrmManagerClient base URL is empty",
			zap.String("service", "crm-manager"))
		return nil, fmt.Errorf("CrmManagerClient base URL cannot be empty")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger is nil")
	}

	concreteClient := &CrmSHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
		logger:  logger,
	}
	return concreteClient, nil
}

func (c *CrmSHTTPClient) BaseUrl() string {
	return c.baseURL
}

func (c *CrmSHTTPClient) GetOrCreateCustomer(ctx context.Context, customerID, customerName string) (*model.SlimCustomer, error) {
	// Implementation of the method to get or create a customer in the CRM system.
	// This is a placeholder for the actual HTTP request logic.
	return &model.SlimCustomer{
		ID:       customerID,
		Code:     "CUST001",
		Name:     customerName,
		Nikename: "CustNick",
		Status:   "Active",
	}, nil
}
