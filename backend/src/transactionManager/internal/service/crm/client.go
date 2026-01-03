package crmService

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"syscall"
	"time"
	"transaction-gold/internal/model"
	"transaction-gold/internal/service/common"

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

func (c *CrmSHTTPClient) CreateCustomer(ctx context.Context, req string) (*model.SlimCustomer, error) {
	defer c.logger.Sync()

	if req == " " {
		c.logger.Error("Request is nil before marshaling",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"))
		return nil, fmt.Errorf("request is nil")
	}
	if ctx == nil {
		c.logger.Error("Context is nil before sending request",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"))
		return nil, fmt.Errorf("context is nil")
	}

	if c.baseURL == "" {
		c.logger.Error("CRMManagerClient base URL is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"))
		return nil, fmt.Errorf("CRMManagerClient base URL is not set")
	}

	c.logger.Debug("Attempting to marshal request for CRM Manager",
		zap.String("service", "crm-manager"),
		zap.String("operation", "create-customer"),
		zap.Any("request_to_marshal", req))

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal request",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/crm/customers", bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create Customer request",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create Customer request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	internalServiceSecret := os.Getenv("CRM_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		c.logger.Error("CRM_MANAGER_SERVICE_SECRET environment variable is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"))
		return nil, fmt.Errorf("CRM_MANAGER_SERVICE_SECRET environment variable is not set")
	}
	httpReq.Header.Set("X-Service-Secret", internalServiceSecret)

	resp, err := c.client.Do(httpReq.WithContext(ctx))
	if err != nil {
		c.logger.Error("Failed to send Customer request to CRM Manager",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return nil, fmt.Errorf("%w: timeout connecting to CRM manager service at %s", common.ErrCrmManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: connection refused to CRM manager service at %s", common.ErrCrmManagerDown, c.baseURL)
		}
		return nil, fmt.Errorf("failed to send Customer request to CRM manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read CRM Manager response body",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to read CRM Manager response body: %w", err)
	}

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("CRM Manager returned error response for registration",
				zap.String("service", "crm-manager"),
				zap.String("operation", "create-customer"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusConflict {
				return nil, fmt.Errorf("%w: %s", common.ErrUserAlreadyExists, errorResp.Message)
			}
			return nil, fmt.Errorf("CRM manager registration failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("CRM Manager returned unexpected error status for registration",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		if resp.StatusCode == http.StatusConflict {
			return nil, fmt.Errorf("%w: user with this context already exists", common.ErrUserAlreadyExists)
		}
		return nil, fmt.Errorf("CRM manager registration failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var customer model.SlimCustomer
	if err := json.Unmarshal(respBody, &customer); err != nil {
		c.logger.Error("Failed to decode response",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	c.logger.Debug("Customer created successfully in CRM Manager",
		zap.String("service", "crm-manager"),
		zap.String("operation", "create-customer"),
		zap.String("customer_code", customer.Code))
	return &customer, nil

}

func (c *CrmSHTTPClient) GetCustomer(ctx context.Context, customerID string, customerName string) ([]model.SlimCustomer, error) {
	defer c.logger.Sync()

	if c.baseURL == "" {
		c.logger.Error("CRMManagerClient base URL is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-customer"))
		return nil, fmt.Errorf("CRMManagerClient base URL is not set")
	}

	u, _ := url.Parse(c.baseURL)
	u.Path = "/crm/customers"
	q := u.Query()
	if customerID != "" {
		q.Set("code", customerID) 
	}
	q.Set("name", customerName)
	u.RawQuery = q.Encode()

	targetURL := u.String()
	httpReq, err := http.NewRequest(http.MethodGet, targetURL, nil)

	if err != nil {
		c.logger.Error("Failed to Get Customers request",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to Get Customers request: %w", err)
	}

	internalServiceSecret := os.Getenv("CRM_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		c.logger.Error("CRM_MANAGER_SERVICE_SECRET environment variable is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"))
		return nil, fmt.Errorf("CRM_MANAGER_SERVICE_SECRET environment variable is not set")
	}
	httpReq.Header.Set("X-Service-Secret", internalServiceSecret)

	resp, err := c.client.Do(httpReq.WithContext(ctx))
	if err != nil {
		c.logger.Error("Failed to send Get Customers request to CRM Manager",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return nil, fmt.Errorf("%w: timeout connecting to CRM manager service at %s", common.ErrCrmManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: connection refused to CRM manager service at %s", common.ErrCrmManagerDown, c.baseURL)
		}
		return nil, fmt.Errorf("failed to send Get Customers request to CRM manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read CRM Manager response body",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to read CRM manager response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("CRM Manager returned error response for get customers",
				zap.String("service", "crm-manager"),
				zap.String("operation", "get-all-customers"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return nil, fmt.Errorf("CRM manager get customers failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("CRM Manager returned unexpected error status for get customers",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("CRM manager get customers failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var customers []model.SlimCustomer
	if err := json.Unmarshal(respBody, &customers); err != nil {
		c.logger.Error("Failed to decode customers response",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"),
			zap.Error(err),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("failed to decode customers response: %w", err)
	}

	c.logger.Debug("Customers retrieved successfully",
		zap.String("service", "crm-manager"),
		zap.String("operation", "get-all-customers"),
		zap.Int("customer_count", len(customers)))
	return customers, nil

}
