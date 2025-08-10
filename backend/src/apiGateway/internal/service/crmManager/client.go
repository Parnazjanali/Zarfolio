package crmmanager

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

type crmManagerHTTPClient struct {
	baseURL string
	client  *http.Client
	logger  *zap.Logger // اضافه کردن logger به struct
}

func NewCrmManagerClient(baseURL string, logger *zap.Logger) (CrmManagerClient, error) {
	if baseURL == "" {
		logger.Error("CRMManagerClient base URL is empty",
			zap.String("service", "crm-manager"))
		return nil, fmt.Errorf("CRMManagerClient base URL cannot be empty")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger is nil")
	}

	concreteClient := &crmManagerHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
		logger:  logger,
	}
	return concreteClient, nil
}

func (c *crmManagerHTTPClient) BaseUrl() string {
	return c.baseURL
}

func (c *crmManagerHTTPClient) GetAllCustomers(ctx context.Context) ([]model.Customer, error) {
	defer c.logger.Sync() // اطمینان از flush شدن لاگ‌ها

	if c.baseURL == "" {
		c.logger.Error("CRMManagerClient base URL is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"))
		return nil, fmt.Errorf("CRMManagerClient base URL is not set")
	}

	targetURL := c.baseURL + "/crm/customers"

	httpReq, err := http.NewRequest(http.MethodGet, targetURL, nil)
	if err != nil {
		c.logger.Error("Failed to create Get Customers request",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create Get Customers request: %w", err)
	}

	token, ok := ctx.Value("userToken").(string)
	if !ok || token == "" {
		c.logger.Error("User token not found in context",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"))
		return nil, fmt.Errorf("user token not found in context")
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)

	internalServiceSecret := os.Getenv("CRM_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		c.logger.Error("CRM_MANAGER_SERVICE_SECRET environment variable is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "get-all-customers"))
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
			return nil, fmt.Errorf("%w: timeout connecting to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: connection refused to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
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

	var customers []model.Customer
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

func (c *crmManagerHTTPClient) CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error) {
	defer c.logger.Sync()

	if req == nil {
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

	token, ok := ctx.Value("userToken").(string)
	if !ok || token == "" {
		c.logger.Error("User token not found in context",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"))
		return nil, fmt.Errorf("user token not found in context")
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
	httpReq.Header.Set("Authorization", "Bearer "+token)

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
			return nil, fmt.Errorf("%w: timeout connecting to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: connection refused to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
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
				return nil, fmt.Errorf("%w: %s", service.ErrUserAlreadyExists, errorResp.Message)
			}
			return nil, fmt.Errorf("CRM manager registration failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("CRM Manager returned unexpected error status for registration",
			zap.String("service", "crm-manager"),
			zap.String("operation", "create-customer"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		if resp.StatusCode == http.StatusConflict {
			return nil, fmt.Errorf("%w: user with this context already exists", service.ErrUserAlreadyExists)
		}
		return nil, fmt.Errorf("CRM manager registration failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var customer model.Customer
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

func (c *crmManagerHTTPClient) UpdateCustomer(ctx context.Context, id string, req *model.UpdateCustomerRequest) (*model.Customer, error) {
	defer c.logger.Sync()

	if c.baseURL == "" {
		c.logger.Error("CRMManagerClient base URL is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"))
		return nil, fmt.Errorf("CRMManagerClient base URL is not set")
	}

	token, ok := ctx.Value("userToken").(string)
	if !ok || token == "" {
		c.logger.Error("User token not found in context",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"))
		return nil, fmt.Errorf("user token not found in context")
	}

	c.logger.Debug("Attempting to marshal request for CRM Manager",
		zap.String("service", "crm-manager"),
		zap.String("operation", "update-customer"),
		zap.Any("request_to_marshal", req))

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal request",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPut, c.baseURL+"/crm/customers/"+id, bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create Update Customer request",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create Update Customer request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+token)

	internalServiceSecret := os.Getenv("CRM_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		c.logger.Error("CRM_MANAGER_SERVICE_SECRET environment variable is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"))
		return nil, fmt.Errorf("CRM_MANAGER_SERVICE_SECRET environment variable is not set")
	}
	httpReq.Header.Set("X-Service-Secret", internalServiceSecret)

	resp, err := c.client.Do(httpReq.WithContext(ctx))
	if err != nil {
		c.logger.Error("Failed to send Update Customer request to CRM Manager",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return nil, fmt.Errorf("%w: timeout connecting to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: connection refused to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
		}
		return nil, fmt.Errorf("failed to send Update Customer request to CRM manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read CRM Manager response body",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to read CRM manager response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("CRM Manager returned error response for update",
				zap.String("service", "crm-manager"),
				zap.String("operation", "update-customer"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusNotFound {
				return nil, fmt.Errorf("%w: customer not found", service.ErrCustomerNotFound)
			}
			return nil, fmt.Errorf("CRM manager update failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("CRM Manager returned unexpected error status for update",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		if resp.StatusCode == http.StatusNotFound {
			return nil, fmt.Errorf("%w: customer not found", service.ErrCustomerNotFound)
		}
		return nil, fmt.Errorf("CRM manager update failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var customer model.Customer
	if err := json.Unmarshal(respBody, &customer); err != nil {
		c.logger.Error("Failed to decode response",
			zap.String("service", "crm-manager"),
			zap.String("operation", "update-customer"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	c.logger.Debug("Customer updated successfully in CRM Manager",
		zap.String("service", "crm-manager"),
		zap.String("operation", "update-customer"),
		zap.String("customer_code", customer.Code))
	return &customer, nil
}

func (c *crmManagerHTTPClient) DeleteCustomer(ctx context.Context, id string) error {
	defer c.logger.Sync()

	if c.baseURL == "" {
		c.logger.Error("CRMManagerClient base URL is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "delete-customer"))
		return fmt.Errorf("CRMManagerClient base URL is not set")
	}

	token, ok := ctx.Value("userToken").(string)
	if !ok || token == "" {
		c.logger.Error("User token not found in context",
			zap.String("service", "crm-manager"),
			zap.String("operation", "delete-customer"))
		return fmt.Errorf("user token not found in context")
	}

	httpReq, err := http.NewRequest(http.MethodDelete, c.baseURL+"/crm/customers/"+id, nil)
	if err != nil {
		c.logger.Error("Failed to create Delete Customer request",
			zap.String("service", "crm-manager"),
			zap.String("operation", "delete-customer"),
			zap.Error(err))
		return fmt.Errorf("failed to create Delete Customer request: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)

	internalServiceSecret := os.Getenv("CRM_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		c.logger.Error("CRM_MANAGER_SERVICE_SECRET environment variable is not set",
			zap.String("service", "crm-manager"),
			zap.String("operation", "delete-customer"))
		return fmt.Errorf("CRM_MANAGER_SERVICE_SECRET environment variable is not set")
	}
	httpReq.Header.Set("X-Service-Secret", internalServiceSecret)

	resp, err := c.client.Do(httpReq.WithContext(ctx))
	if err != nil {
		c.logger.Error("Failed to send Delete Customer request to CRM Manager",
			zap.String("service", "crm-manager"),
			zap.String("operation", "delete-customer"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return fmt.Errorf("%w: timeout connecting to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: connection refused to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send Delete Customer request to CRM manager: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		c.logger.Error("Customer not found",
			zap.String("service", "crm-manager"),
			zap.String("operation", "delete-customer"),
			zap.String("customer_id", id))
		return fmt.Errorf("%w: customer not found", service.ErrCustomerNotFound)
	} else if resp.StatusCode != http.StatusNoContent {
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			c.logger.Error("Failed to read CRM Manager response body",
				zap.String("service", "crm-manager"),
				zap.String("operation", "delete-customer"),
				zap.Error(err))
			return fmt.Errorf("failed to read CRM manager response body: %w", err)
		}
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("CRM Manager returned error response for deletion",
				zap.String("service", "crm-manager"),
				zap.String("operation", "delete-customer"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return fmt.Errorf("CRM manager deletion failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("CRM Manager returned unexpected error status for deletion",
			zap.String("service", "crm-manager"),
			zap.String("operation", "delete-customer"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("CRM manager deletion failed with unexpected status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("Customer deleted successfully in CRM Manager",
		zap.String("service", "crm-manager"),
		zap.String("operation", "delete-customer"),
		zap.String("customer_id", id))
	return nil
}
