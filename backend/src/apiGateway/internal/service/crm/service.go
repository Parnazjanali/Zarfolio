package crm

import (
	"context"
	"fmt"
	"gold-api/internal/model"
	crmmanager "gold-api/internal/service/crmManager"
	"gold-api/internal/utils"

	"go.uber.org/zap"
)

type CrmService interface {
	GetAllCustomers(ctx context.Context) ([]model.Customer, error)
	CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error)
}

type CrmServiceImpl struct {
	crmManagerClient crmmanager.CrmManagerClient
}

func NewCrmService(client crmmanager.CrmManagerClient) (CrmService, error) {
	if client == nil {
		utils.Log.Error("CrmManagerClient passed to NewCrmService is nil.", zap.String("reason", "crm_manager_client_is_nil"))
		return nil, fmt.Errorf("CRMManagerClient cannot be nil for CrmService")
	}

	utils.Log.Info("CrmService initialized successfully.")
	return &CrmServiceImpl{crmManagerClient: client}, nil
}

func (s *CrmServiceImpl) GetAllCustomers(ctx context.Context) ([]model.Customer, error) {

	utils.Log.Info("Fetching all customers from service layer.")

	customers, err := s.crmManagerClient.GetAllCustomers(ctx)
	if err != nil {
		utils.Log.Error("Failed to fetch customers from database", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch customers: %w", err)
	}
	return customers, nil
}

func (s *CrmServiceImpl) CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error) {

    customer, err := s.crmManagerClient.CreateCustomer(ctx, req)
	if err != nil {
		utils.Log.Error("Failed to create customer in CRM Manager", zap.Error(err))
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	utils.Log.Info("Customer created successfully in CRM Manager", zap.String("customer_code", customer.Code))

	return customer, nil 
}
