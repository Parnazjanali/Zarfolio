package crmService

import (
	"context"
	"transaction-gold/internal/model"
)

type CrmServiceClient interface {
	GetOrCreateCustomer(ctx context.Context, customerID string, customerName string) (*model.SlimCustomer, error)
		BaseUrl() string

}
