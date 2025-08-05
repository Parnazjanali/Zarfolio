package crmmanager

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	"gold-api/internal/utils"
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
}

func NewCrmManagerClient(baseURL string) (CrmManagerClient, error) {
	if baseURL == "" {
		return nil, fmt.Errorf("ProfileManagerClient base URL cannot be empty")
	}

	concreteClient := &crmManagerHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
	}

	return concreteClient, nil
}

func (c *crmManagerHTTPClient) BaseUrl() string {
	return c.baseURL
}

func (c *crmManagerHTTPClient) GetAllCustomers(ctx context.Context) ([]model.Customer, error) {
    if c.baseURL == "" {
        return nil, fmt.Errorf("CRMManagerClient base URL is not set")
    }

    targetURL := c.baseURL + "/crm/customers"

    httpReq, err := http.NewRequest(http.MethodGet, targetURL, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to create Get Customers request: %w", err)
    }

    token, ok := ctx.Value("userToken").(string)
    if !ok || token == "" {
        return nil, fmt.Errorf("user token not found in context")
    }
    httpReq.Header.Set("Authorization", "Bearer "+token)

    internalServiceSecret := os.Getenv("CRM_MANAGER_SERVICE_SECRET")
    if internalServiceSecret == "" {
        return nil, fmt.Errorf("CRM_MANAGER_SERVICE_SECRET environment variable is not set")
    }
    httpReq.Header.Set("X-Service-Secret", internalServiceSecret)

    resp, err := c.client.Do(httpReq.WithContext(ctx))
    if err != nil {
        return nil, fmt.Errorf("failed to send Get Customers request to CRM manager: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        var errorResp model.ErrorResponse
        if unmarshalErr := json.NewDecoder(resp.Body).Decode(&errorResp); unmarshalErr == nil {
            return nil, fmt.Errorf("CRM manager returned error: %s (%d)", errorResp.Message, resp.StatusCode)
        }
        return nil, fmt.Errorf("CRM manager returned unexpected status code: %d", resp.StatusCode)
    }

    var customers []model.Customer
    if err := json.NewDecoder(resp.Body).Decode(&customers); err != nil {
        return nil, fmt.Errorf("failed to decode customers response: %w", err)
    }

    return customers, nil
}

func (c *crmManagerHTTPClient) CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error) {
	if req == nil {
		utils.Log.Error("Request is nil before marshaling!")
		return nil, fmt.Errorf("request is nil")
	}
	if ctx == nil{
		utils.Log.Error("Context is nil before sending request!")
		return nil, fmt.Errorf("context is nil")
	}
	
	if c.baseURL == "" {
		return nil, fmt.Errorf("CRMManagerClient base URL is not set")
	}

	token, ok := ctx.Value("userToken").(string)
	if !ok || token == "" {

		return nil, fmt.Errorf("user token not found in context")
	}

	utils.Log.Info("Attempting to marshal request for CRM Manager", zap.Any("request_to_marshal", req))

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/crm/customers", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create Customer request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+token)

	internalServiceSecret := os.Getenv("CRM_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		utils.Log.Error("CRM_MANAGER_SERVICE_SECRET environment variable is not set. Exiting application.")
		return nil, fmt.Errorf("CRM_MANAGER_SERVICE_SECRET environment variable is not set")
	}
	httpReq.Header.Set("X-Service-Secret", internalServiceSecret)

	resp, err := c.client.Do(httpReq.WithContext(ctx))
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return nil, fmt.Errorf("%w: timeout connecting to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: connection refused to CRM manager service at %s", service.ErrCrmManagerDown, c.baseURL)
		}
		return nil, fmt.Errorf("failed to send Cutomer request to CRM manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read profile manager registration response body: %w", err)
	}

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			utils.Log.Error("Crm Manager returned error response for registration", zap.Int("status", resp.StatusCode), zap.String("message", errorResp.Message), zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusConflict {
				return nil, fmt.Errorf("%w: %s", service.ErrUserAlreadyExists, errorResp.Message)
			}
			return nil, fmt.Errorf("Crm manager registration failed: %s (%d)", errorResp.Message, resp.StatusCode)
		} else {
			utils.Log.Error("Crm Manager returned unexpected error status for registration", zap.Int("status", resp.StatusCode), zap.ByteString("raw_body", respBody))
			if resp.StatusCode == http.StatusConflict {
				return nil, fmt.Errorf("%w: user with this context already exists", service.ErrUserAlreadyExists)
			}
			return nil, fmt.Errorf("CRM manager registration failed with status %d: %s", resp.StatusCode, string(respBody))
		}
	}

	var customer model.Customer
	if err := json.Unmarshal(respBody, &customer); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &customer, nil
}
