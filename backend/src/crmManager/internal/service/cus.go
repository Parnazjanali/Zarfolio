package service

import (
	"context"
	"errors"
	"fmt"

	"crm-gold/internal/model"
	"crm-gold/internal/repository/repo"
	"crm-gold/internal/utils" 

	"go.uber.org/zap"
)

type CusService interface {
	CreateCustomer(ctx context.Context, customer *model.Customer) (*model.Customer, error)
	GetCustomers(ctx context.Context) ([]model.Customer, error)
}

type customerServiceImpl struct {
	customerRepo repo.CustRepo
	logger       *zap.Logger
}

func NewCustomerService(customerRepo repo.CustRepo, logger *zap.Logger) (CusService,error) {
	if customerRepo == nil {
		utils.Log.Fatal("customerRepository cannot be nil for CustomerService.")
	}
	if logger == nil {
		utils.Log.Fatal("logger cannot be nil for CustomerService.")
	}
	return &customerServiceImpl{
		customerRepo: customerRepo,
		logger:       logger,
	}, nil
}

func (s *customerServiceImpl) CreateCustomer(ctx context.Context, customer *model.Customer) (*model.Customer, error) {
	s.logger.Info("Attempting to create a new customer in service layer.",
		zap.String("customer_code", customer.Code), zap.String("nikename", customer.Nikename))

	
	if customer.Code == "" {
		return nil, errors.New("customer code is required")
	}
	if customer.Nikename == "" {
		return nil, errors.New("customer nikename is required")
	}
	if customer.Name == "" {
		return nil, errors.New("customer name is required")
	}
	if customer.Mobile == "" {
		return nil, errors.New("customer mobile is required")
	}
	if customer.Shenasemeli == "" {
		return nil, errors.New("customer shenasemeli is required")
	}
	if customer.BIDID == 0 { 
		return nil, errors.New("business ID is required")
	}

	existingCustomer, err := s.customerRepo.GetCustomerByUniqueFields(ctx, customer.Code, customer.Nikename, customer.Mobile, customer.Shenasemeli, customer.BIDID)
	if err != nil {
		return nil, fmt.Errorf("failed to check for existing customer: %w", err)
	}
	if existingCustomer != nil {
		return nil, errors.New("customer with provided unique fields already exists")
	}

	
	if customer.Code == "" { 
		generatedCode, err := s.generateUniqueCustomerCode(ctx, customer.BIDID)
		if err != nil {
			return nil, fmt.Errorf("failed to generate unique customer code: %w", err)
		}
		customer.Code = generatedCode
	}

	createdCustomer, err := s.customerRepo.CreateCustomer(ctx, customer)
	if err != nil {
		s.logger.Error("Failed to save new customer to database", zap.Error(err))
		return nil, fmt.Errorf("failed to save customer: %w", err)
	}

	s.logger.Info("Customer created successfully in service layer.", zap.Uint("customer_id", createdCustomer.ID))
	return createdCustomer, nil
}

func (s *customerServiceImpl) generateUniqueCustomerCode(ctx context.Context, bidID uint) (string, error) {
	const maxAttempts = 10
	for i := 0; i < maxAttempts; i++ {

		randomStr,err := utils.GenerateSecureRandomString(8) 
		if err != nil {
			return "", fmt.Errorf("failed to generate random string for customer code: %w", err)
			
		}

		code := fmt.Sprintf("CUS-%s", randomStr)

		exists, err := s.customerRepo.CheckCustomerCodeExists(ctx, bidID, code)
		if err != nil {
			return "", fmt.Errorf("failed to check unique customer code existence: %w", err)
		}
		if !exists {
			return code, nil
		}
		s.logger.Warn("Generated customer code already exists, retrying.", zap.String("code", code))
	}
	return "", errors.New("failed to generate a unique customer code after multiple attempts")
}

func (s *customerServiceImpl) GetCustomers(ctx context.Context) ([]model.Customer, error) {
	s.logger.Info("Fetching all customers from service layer.")
	customers, err := s.customerRepo.GetAllCustomers(ctx) // <-- این متد را در ریپازیتوری پیاده‌سازی کنید
	if err != nil {
		s.logger.Error("Failed to fetch customers from database", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch customers: %w", err)
	}
	return customers, nil
}
