package postgresDb

import (
	"context"
	"crm-gold/internal/model"
	"crm-gold/internal/repository/repo"
	"errors"
	"fmt"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type customerRepositoryImpl struct {
	db     *gorm.DB
	logger *zap.Logger
}

func NewCustomerRepository(db *gorm.DB, logger *zap.Logger) (repo.CustRepo, error) {
	if db == nil {
		return nil, errors.New("database connection cannot be nil for CustomerRepository")
	}
	if logger == nil {
		return nil, errors.New("logger cannot be nil for CustomerRepository")
	}
	return &customerRepositoryImpl{
		db:     db,
		logger: logger,
	}, nil
}
func (r *customerRepositoryImpl) CheckCustomerCodeExists(ctx context.Context, id uint, code string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Customer{}).Where("id = ? AND code = ?", id, code).Count(&count).Error
	if err != nil {
		r.logger.Error("failed to check customer code existence", zap.Error(err))
		return false, err
	}
	return count > 0, nil
}
func (r *customerRepositoryImpl) CreateCustomer(ctx context.Context, customer *model.Customer) (*model.Customer, error) {
	r.logger.Debug("Attempting to save customer to database.", zap.String("code", customer.Code))

	result := r.db.WithContext(ctx).Create(customer)
	if result.Error != nil {
		r.logger.Error("Failed to save customer to database.", zap.Error(result.Error), zap.String("customer_code", customer.Code))
		return nil, result.Error
	}

	r.logger.Info("Customer saved successfully to database.", zap.Uint("customer_id", customer.ID))
	return customer, nil
}

func (r *customerRepositoryImpl) GetAllCustomers(ctx context.Context) ([]model.Customer, error) {
	var customers []model.Customer
	if err := r.db.WithContext(ctx).Find(&customers).Error; err != nil {
		r.logger.Error("failed to get all customers", zap.Error(err))
		return nil, err
	}
	return customers, nil
}

func (r *customerRepositoryImpl) GetCustomerByCode(ctx context.Context, code string) (*model.Customer, error) {
	var customer model.Customer
	if err := r.db.WithContext(ctx).Where("code = ?", code).First(&customer).Error; err != nil {
		r.logger.Error("failed to get customer by code", zap.String("code", code), zap.Error(err))
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepositoryImpl) GetCustomerByID(ctx context.Context, id uint) (*model.Customer, error) {
	var customer model.Customer
	if err := r.db.WithContext(ctx).First(&customer, id).Error; err != nil {
		r.logger.Error("failed to get customer by ID", zap.Uint("id", id), zap.Error(err))
		return nil, err
	}
	return &customer, nil
}
func (r *customerRepositoryImpl) GetCustomerByUniqueFields(ctx context.Context, code, nikename, mobile, shenasemeli string, bidID uint) (*model.Customer, error) {
	var customer model.Customer
	if err := r.db.WithContext(ctx).Where("code = ? AND nikename = ? AND mobile = ? AND shenasemeli = ? AND bid_id = ?", code, nikename, mobile, shenasemeli, bidID).First(&customer).Error; err != nil {
		r.logger.Error("failed to get customer by unique fields", zap.String("code", code), zap.String("nikename", nikename), zap.String("mobile", mobile), zap.String("shenasemeli", shenasemeli), zap.Uint("bid_id", bidID), zap.Error(err))
		return nil, err
	}
	return &customer, nil
}
func (r *customerRepositoryImpl) FindOrCreateCusType(ctx context.Context, label string) (*model.CusType, error) {
	var cusType model.CusType
	result := r.db.WithContext(ctx).Where("label = ?", label).FirstOrCreate(&cusType, model.CusType{Label: label, Code: label})

	if result.Error != nil {
		return nil, fmt.Errorf("failed to find or create customer type: %w", result.Error)
	}
	return &cusType, nil
}
