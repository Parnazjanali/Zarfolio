package customerService

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"crm-gold/internal/model"
	"crm-gold/internal/repository/repo"
	service "crm-gold/internal/service/common"
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
	GetCustomerByCode(ctx context.Context, code string)(*model.Customer, error)
	CreateCustomerTypes(ctx context.Context, label string) (*model.CusType, error)
	DeleteCustomerTypes(ctx context.Context, code string) error
	SearchCustomers(ctx context.Context, req *model.CustomerSearchRequest) (*model.SearchResponse, error)
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
	if err == nil {
		return nil, errors.New("customer with provided unique fields already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("failed to check for existing customer: %w", err)
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

func (s *customerServiceImpl) DeleteCustomerTypes(ctx context.Context, code string) error {
    s.logger.Info("Attempting to delete a customer type", zap.String("code", code))

    if strings.TrimSpace(code) == "" {
        return errors.New("customer type code cannot be empty")
    }

    inUse, err := s.customerRepo.IsCustomerTypeInUse(ctx, code)
    if err != nil {
        s.logger.Error("Failed to check if customer type is in use", zap.String("code", code), zap.Error(err))
        return fmt.Errorf("failed to check if customer type is in use: %w", err)
    }
    if inUse {
        return errors.New("cannot delete customer type because it is currently assigned to one or more customers")
    }

    err = s.customerRepo.DeleteCustomerTypeByCode(ctx, code)
    if err != nil {
        if errors.Is(err, service.ErrNotFound) {
            s.logger.Warn("Attempted to delete a non-existent customer type", zap.String("code", code))
            return errors.New("customer type not found")
        }
        s.logger.Error("Failed to delete customer type from database", zap.String("code", code), zap.Error(err))
        return fmt.Errorf("failed to delete customer type: %w", err)
    }

    s.logger.Info("Customer type deleted successfully", zap.String("code", code))
    return nil
}

func (s *customerServiceImpl) CreateCustomerTypes(ctx context.Context, label string) (*model.CusType, error) {
    s.logger.Info("Attempting to create a new customer type", zap.String("label", label))

    trimmedLabel := strings.TrimSpace(label)
    if trimmedLabel == "" {
        return nil, errors.New("customer type label cannot be empty")
    }

    existingType, err := s.customerRepo.FindCusTypeByLabel(ctx, trimmedLabel)
    if err != nil && !errors.Is(err, service.ErrNotFound) {

		s.logger.Error("Failed to check for existing customer type", zap.String("label", trimmedLabel), zap.Error(err))
        return nil, fmt.Errorf("failed to check for existing customer type: %w", err)
    }
    if existingType != nil {

		return nil, fmt.Errorf("customer type with label '%s' already exists", trimmedLabel)
    }

    cusType := &model.CusType{
        Label: trimmedLabel,
    }

    createdCusType, err := s.customerRepo.CreateCustomerType(ctx, cusType)
    if err != nil {
        s.logger.Error("Failed to save new customer type to database", zap.String("label", trimmedLabel), zap.Error(err))
        return nil, fmt.Errorf("failed to save customer type: %w", err)
    }

    s.logger.Info("Customer type created successfully", zap.Uint("id", createdCusType.ID), zap.String("label", createdCusType.Label))
    return createdCusType, nil
}

func (s *customerServiceImpl) SearchCustomers(ctx context.Context, req *model.CustomerSearchRequest) (*model.SearchResponse, error) {
   
	s.logger.Info("Executing customer search in service layer", zap.Any("criteria", req))


    searchResult, err := s.customerRepo.SearchCustomers(ctx, req)
    if err != nil {
        s.logger.Error("Failed to search for customers in repository", zap.Error(err))
        return nil, fmt.Errorf("failed to search for customers: %w", err)
    }

    s.logger.Info("Customer search completed", zap.Int64("total_found", searchResult.Total))
    return searchResult, nil
}

func (s *customerServiceImpl) GetCustomerByCode(ctx context.Context, code string) (*model.Customer, error) {

	trimmedCode := strings.TrimSpace(code)

    if trimmedCode == "" {
        return nil, errors.New("customer code cannot be empty")
    }

    s.logger.Info("Attempting to get customer by code", zap.String("code", trimmedCode))

    customer, err := s.customerRepo.GetCustomerByCode(ctx, trimmedCode)
    if err != nil {
        s.logger.Error("Repository failed to get customer by code", zap.String("code", trimmedCode), zap.Error(err))
        
        
        if errors.Is(err, service.ErrNotFound) {
            return nil, service.ErrNotFound 
        }
        
        return nil, fmt.Errorf("failed to retrieve customer from repository: %w", err)
    }

    s.logger.Info("Successfully found customer", zap.String("code", customer.Code), zap.Uint("customer_id", customer.ID))
    return customer, nil
}