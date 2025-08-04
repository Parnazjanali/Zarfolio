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
    GetCustomers() error
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

func (s *CrmServiceImpl) GetCustomers() error {
    return nil
}

func (s *CrmServiceImpl) CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error) {
    // 1. Make the client call to the actual crmManager service
    customer, err := s.crmManagerClient.CreateCustomer(ctx, req)
    if err != nil {
        utils.Log.Error("Failed to create customer in CRM Manager", zap.Error(err))
        // 2. On error, return nil for the *model.Customer and the error
        return nil, fmt.Errorf("failed to create customer: %w", err) // FIX: Return nil here
    }

    utils.Log.Info("Customer created successfully in CRM Manager", zap.String("customer_code", customer.Code))
    // 3. On success, return the customer instance and a nil error
    return customer, nil // FIX: Correct return statement
}