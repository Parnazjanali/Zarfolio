package service

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"crm-gold/internal/model"
	"crm-gold/internal/repository/repo"
	"crm-gold/internal/utils"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type CusService interface {
	CreateCustomer(ctx context.Context, customer *model.CreateCustomerRequest) (*model.Customer, error)
	GetAllCustomers(ctx context.Context) ([]model.Customer, error)
	UpdateCustomer(ctx context.Context, id string, customer *model.UpdateCustomerRequest) (*model.Customer, error)
	DeleteCustomer(ctx context.Context, id string) error
	GetCustomerTypes(ctx context.Context) ([]model.CusType, error)
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
	if req.Code == "" {
		newCode, err := s.generateUniqueCustomerCode(ctx, req.BIDID)
		if err != nil {
			return nil, fmt.Errorf("failed to generate unique customer code: %w", err)
		}
		req.Code = newCode
	}

	existingCustomer, err := s.customerRepo.GetCustomerByUniqueFields(ctx, req.Code, req.Nikename, req.Mobile, req.Shenasemeli, req.BIDID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {

		} else {

			return nil, fmt.Errorf("failed to check for existing customer: %w", err)
		}
	}

	if existingCustomer != nil {
		return nil, errors.New("customer with provided unique fields already exists")
	}

	var customerTypes []model.CusType
	if req.CustomerCategory != "" {

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

func (s *customerServiceImpl) GetAllCustomers(ctx context.Context) ([]model.Customer, error) {

	s.logger.Info("Fetching all customers from service layer.")
	customers, err := s.customerRepo.GetAllCustomers(ctx)
	if err != nil {
		s.logger.Error("Failed to fetch customers from database", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch customers: %w", err)
	}
	return customers, nil
}
func (s *customerServiceImpl) UpdateCustomer(ctx context.Context, id string, req *model.UpdateCustomerRequest) (*model.Customer, error) {

	customerID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		s.logger.Error("Invalid customer ID format", zap.String("id", id), zap.Error(err))
		return nil, errors.New("invalid customer ID format")
	}

	s.logger.Info("Attempting to update customer.", zap.Uint64("customer_id", customerID))

	updatedCustomer, err := s.customerRepo.UpdateCustomer(ctx, uint(customerID), req)
	if err != nil {
		s.logger.Error("Failed to update customer in database", zap.Uint64("customer_id", customerID), zap.Error(err))
		if strings.Contains(err.Error(), "not found") {
			return nil, errors.New("customer not found")
		}
		return nil, fmt.Errorf("failed to update customer: %w", err)
	}

	s.logger.Info("Customer updated successfully.", zap.Uint("customer_id", updatedCustomer.ID), zap.String("customer_code", updatedCustomer.Code))
	return updatedCustomer, nil
}

func (s *customerServiceImpl) DeleteCustomer(ctx context.Context, id string) error {

	customerID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		s.logger.Error("Invalid customer ID format", zap.String("id", id), zap.Error(err))
		return errors.New("invalid customer ID format")
	}
	s.logger.Info("Attempting to delete customer.", zap.Uint64("customer_id", customerID))

	err = s.customerRepo.DeleteCustomer(ctx, uint(customerID))
	if err != nil {
		s.logger.Error("Failed to delete customer from database", zap.Uint64("customer_id", customerID), zap.Error(err))
		if strings.Contains(err.Error(), "not found") {
			return errors.New("customer not found")
		}
		return fmt.Errorf("failed to delete customer: %w", err)
	}
	s.logger.Info("Customer deleted successfully.", zap.Uint64("customer_id", customerID))
	return nil
}

func (s *customerServiceImpl) GetCustomerTypes(ctx context.Context) ([]model.CusType, error) {
	s.logger.Info("Fetching all customer types from service layer.")
	customerTypes, err := s.customerRepo.GetAllCustomerTypes(ctx)
	if err != nil {
		s.logger.Error("Failed to fetch customer types from database", zap.Error(err))
		return nil, fmt.Errorf("failed to fetch customer types: %w", err)
	}
	return customerTypes, nil
}