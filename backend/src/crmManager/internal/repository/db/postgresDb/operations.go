package postgresDb

import (
	"context"
	"crm-gold/internal/model"
	"crm-gold/internal/repository/repo"
	service "crm-gold/internal/service/common"
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

func (r *customerRepositoryImpl) UpdateCustomer(ctx context.Context, id uint, req *model.UpdateCustomerRequest) (*model.Customer, error) {
	var customer model.Customer
	if err := r.db.WithContext(ctx).Model(&customer).Where("id = ?", id).Updates(req).Error; err != nil {
		r.logger.Error("failed to update customer", zap.Uint("id", id), zap.Error(err))
		return nil, fmt.Errorf("failed to update customer: %w", err)
	}
	return &customer, nil
}

func (r *customerRepositoryImpl) DeleteCustomer(ctx context.Context, id uint) error {
	if err := r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Customer{}).Error; err != nil {
		r.logger.Error("failed to delete customer", zap.Uint("id", id), zap.Error(err))
		return fmt.Errorf("failed to delete customer: %w", err)
	}
	return nil
}

func (r *customerRepositoryImpl) GetAllCustomerTypes(ctx context.Context) ([]model.CusType, error) {
	var customerTypes []model.CusType
	if err := r.db.WithContext(ctx).Find(&customerTypes).Error; err != nil {
		r.logger.Error("failed to get all customer types", zap.Error(err))
		return nil, err
	}
	return customerTypes, nil
}

func (r *customerRepositoryImpl) FindCusTypeByLabel(ctx context.Context, label string) (*model.CusType, error) {
    var cusType model.CusType
    if err := r.db.WithContext(ctx).Where("label = ?", label).First(&cusType).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {

			return nil, service.ErrNotFound
        }
        r.logger.Error("failed to find customer type by label", zap.String("label", label), zap.Error(err))
        return nil, err
    }
    return &cusType, nil
}

func (r *customerRepositoryImpl) CreateCustomerType(ctx context.Context, cusType *model.CusType) (*model.CusType, error) {
    if err := r.db.WithContext(ctx).Create(cusType).Error; err != nil {
        r.logger.Error("failed to create customer type", zap.String("label", cusType.Label), zap.Error(err))
        return nil, err
    }
    r.logger.Info("Customer type created successfully in database", zap.Uint("id", cusType.ID))
    return cusType, nil
}

func (r *customerRepositoryImpl) IsCustomerTypeInUse(ctx context.Context, code string) (bool, error) {
    var count int64
    // این کوئری جدول واسط (join table) بین مشتریان و انواع مشتری را چک می‌کند
    // نام جدول واسط ممکن است متفاوت باشد (مثلاً customer_cus_types)
    err := r.db.WithContext(ctx).Table("customer_customer_types").
        Joins("JOIN cus_types ON cus_types.id = customer_customer_types.cus_type_id").
        Where("cus_types.code = ?", code).
        Count(&count).Error

    if err != nil {
        r.logger.Error("failed to check if customer type is in use", zap.String("code", code), zap.Error(err))
        return false, err
    }
    return count > 0, nil
}

func (r *customerRepositoryImpl) DeleteCustomerTypeByCode(ctx context.Context, code string) error {
    result := r.db.WithContext(ctx).Where("code = ?", code).Delete(&model.CusType{})
    if result.Error != nil {
        r.logger.Error("failed to delete customer type by code", zap.String("code", code), zap.Error(result.Error))
        return result.Error
    }
    if result.RowsAffected == 0 {
        return service.ErrNotFound
    }
    return nil
}

func (r *customerRepositoryImpl) SearchCustomers(ctx context.Context, req *model.CustomerSearchRequest) (*model.SearchResponse, error) {
    var customers []model.Customer
    var total int64

    query := r.db.WithContext(ctx).Model(&model.Customer{})

    if req.Name != "" {
        query = query.Where("name LIKE ? OR family_name LIKE ?", "%"+req.Name+"%", "%"+req.Name+"%")
    }
    if req.PhoneNumber != "" {
        query = query.Where("mobile LIKE ?", "%"+req.PhoneNumber+"%")
    }
    if len(req.Tags) > 0 {

		query = query.Joins("JOIN customer_customer_types ON customer_customer_types.customer_id = customers.id").
            Joins("JOIN cus_types ON cus_types.id = customer_customer_types.cus_type_id").
            Where("cus_types.label IN (?)", req.Tags)
    }

    if err := query.Count(&total).Error; err != nil {
        r.logger.Error("failed to count search results", zap.Error(err))
        return nil, err
    }

    offset := (req.Page - 1) * req.PageSize
    if err := query.Offset(offset).Limit(req.PageSize).Find(&customers).Error; err != nil {
        r.logger.Error("failed to fetch search results with pagination", zap.Error(err))
        return nil, err
    }

    return &model.SearchResponse{
        Data:  customers,
        Total: total,
    }, nil
}
