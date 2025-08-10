package crm

import (
	"context"
	"errors"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	crmmanager "gold-api/internal/service/crmManager"
	"go.uber.org/zap"
)

type CrmService interface {
	GetAllCustomers(ctx context.Context) ([]model.Customer, error)
	CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error)
	UpdateCustomer(ctx context.Context, customerID string, req *model.UpdateCustomerRequest) (*model.Customer, error)
	DeleteCustomer(ctx context.Context, customerID string) error
}

type CrmServiceImpl struct {
	crmManagerClient crmmanager.CrmManagerClient
	logger           *zap.Logger 
}

func NewCrmService(client crmmanager.CrmManagerClient, logger *zap.Logger) (CrmService, error) {
	if client == nil {

		logger.Error("CrmManagerClient is nil", zap.String("reason", "crm_manager_client_is_nil"))
		return nil, fmt.Errorf("CRMManagerClient cannot be nil for CrmService")
	}

	logger.Debug("CrmService initialized successfully")
	return &CrmServiceImpl{
		crmManagerClient: client,
		logger:           logger,
	}, nil
}

func (s *CrmServiceImpl) GetAllCustomers(ctx context.Context) ([]model.Customer, error) {

	s.logger.Debug("Fetching all customers from service layer")

	customers, err := s.crmManagerClient.GetAllCustomers(ctx)
	if err != nil {

		return nil, fmt.Errorf("failed to fetch customers: %w", err)
	}
	return customers, nil
}

func (s *CrmServiceImpl) CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error) {
	customer, err := s.crmManagerClient.CreateCustomer(ctx, req)
	if err != nil {

		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	s.logger.Debug("Customer created successfully", zap.String("customer_code", customer.Code))
	return customer, nil
}

func (s *CrmServiceImpl) UpdateCustomer(ctx context.Context, customerID string, req *model.UpdateCustomerRequest) (*model.Customer, error) {
	customer, err := s.crmManagerClient.UpdateCustomer(ctx, customerID, req)
	if err != nil {

		return nil, fmt.Errorf("failed to update customer: %w", err)
	}

	s.logger.Debug("Customer updated successfully", zap.String("customer_code", customerID))
	return customer, nil
}

func (s *CrmServiceImpl) DeleteCustomer(ctx context.Context, customerID string) error {
	if err := s.crmManagerClient.DeleteCustomer(ctx, customerID); err != nil {

		if errors.Is(err, service.ErrCustomerNotFound) {
			return fmt.Errorf("%w: customer not found", service.ErrCustomerNotFound)
		}
		return fmt.Errorf("failed to delete customer: %w", err)
	}

	s.logger.Debug("Customer deleted successfully", zap.String("customer_id", customerID))
	return nil
}