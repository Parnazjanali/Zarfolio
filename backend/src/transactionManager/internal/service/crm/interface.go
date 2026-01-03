package crmService

import (
	"context"
	"transaction-gold/internal/model"
)

type CrmServiceClient interface {
	CreateCustomer(ctx context.Context, req string) (*model.SlimCustomer, error)
	GetCustomer(ctx context.Context, customerID, customerName string) ([]model.SlimCustomer, error)
	BaseUrl() string
}
