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
	BaseURL string
	client  *http.Client
}

func NewClient(BaseURL string) (CrmManagerClient, error) {
	if BaseURL == "" {
		return nil, fmt.Errorf("CRM Manager BaseURL cannot be empty")
	}

	concreteClient := &crmManagerHTTPClient{
		BaseURL: BaseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
	}

	return concreteClient, nil
}

func (c *crmManagerHTTPClient) BaseUrl() string {
	return c.BaseURL
}

func (c *crmManagerHTTPClient) GetCustomers() ([]model.Customer, error) {

	return nil, fmt.Errorf("")
}

func (c *crmManagerHTTPClient) CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error) {

	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.BaseURL+"/crm/customers", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create Customer request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return nil, fmt.Errorf("%w: timeout connecting to CRM manager service at %s", service.ErrCrmManagerDown, c.BaseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: connection refused to CRM manager service at %s", service.ErrCrmManagerDown, c.BaseURL)
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
