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
	CreateCustomer(ctx context.Context, customer *model.CreateCustomerRequest) (*model.Customer, error)
	GetCustomers(ctx context.Context) ([]model.Customer, error)
}

type customerServiceImpl struct {
	customerRepo repo.CustRepo
	logger       *zap.Logger
}

func NewCustomerService(customerRepo repo.CustRepo, logger *zap.Logger) (CusService, error) {
	if customerRepo == nil {
		return nil, errors.New("customerRepository cannot be nil for CustomerService")
	}
	if logger == nil {
		return nil, errors.New("logger cannot be nil for CustomerService")
	}
	return &customerServiceImpl{
		customerRepo: customerRepo,
		logger:       logger,
	}, nil
}

func (s *customerServiceImpl) CreateCustomer(ctx context.Context, req *model.CreateCustomerRequest) (*model.Customer, error) {
	s.logger.Info("Attempting to create a new customer in service layer.",
		zap.String("customer_code", req.Code), zap.String("nikename", req.Nikename))

	if req.Nikename == "" {
		return nil, errors.New("customer nikename is required")
	}
	if req.Name == "" {
		return nil, errors.New("customer name is required")
	}
	if req.Mobile == "" {
		return nil, errors.New("customer mobile is required")
	}
	if req.Shenasemeli == "" {
		return nil, errors.New("customer shenasemeli is required")
	}

	existingCustomer, err := s.customerRepo.GetCustomerByUniqueFields(ctx, req.Code, req.Nikename, req.Mobile, req.Shenasemeli, req.BIDID)
	if err != nil {
		return nil, fmt.Errorf("failed to check for existing customer: %w", err)
	}
	if existingCustomer != nil {
		return nil, errors.New("customer with provided unique fields already exists")
	}

	var customerTypes []model.CusType
	if req.CustomerCategory != "" {
		// Find or create the CusType based on the category string
		cusType, err := s.customerRepo.FindOrCreateCusType(ctx, req.CustomerCategory)
		if err != nil {
			return nil, fmt.Errorf("failed to handle customer category: %w", err)
		}
		customerTypes = append(customerTypes, *cusType)
	}

	customer := &model.Customer{
		Code:                req.Code,
		Nikename:            req.Nikename,
		Name:                req.Name,
		FamilyName:          utils.PtrString(req.FamilyName),
		Company:             utils.PtrString(req.Company),
		Mobile:              req.Mobile,
		Mobile2:             utils.PtrString(req.Mobile2),
		Tel:                 utils.PtrString(req.Tel),
		Fax:                 utils.PtrString(req.Fax),
		Email:               utils.PtrString(req.Email),
		Website:             utils.PtrString(req.Website),
		Address:             utils.PtrString(req.Address),
		Postalcode:          utils.PtrString(req.Postalcode),
		Shahr:               utils.PtrString(req.Shahr),
		Ostan:               utils.PtrString(req.Ostan),
		Keshvar:             utils.PtrString(req.Keshvar),
		Shenasemeli:         req.Shenasemeli,
		Codeeghtesadi:       utils.PtrString(req.Codeeghtesadi),
		Sabt:                utils.PtrString(req.Sabt),
		TaxID:               utils.PtrString(req.TaxID),
		BIDID:               req.BIDID,
		InitialBalanceToman: req.InitialBalanceToman,
		InitialBalanceGold:  req.InitialBalanceGold,
		GoldRateType:        utils.PtrString(req.GoldRateType),
		DefaultGoldUnit:     utils.PtrString(req.DefaultGoldUnit),
		DefaultGoldUnitRate: utils.PtrFloat64(req.DefaultGoldUnitRate),
		CustomerTypes:       customerTypes,
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

		randomStr, err := utils.GenerateSecureRandomString(8)
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
