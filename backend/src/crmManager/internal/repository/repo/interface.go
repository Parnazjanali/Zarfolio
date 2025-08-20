package repo

import (
	"context"
	"crm-gold/internal/model"
)

type CustRepo interface {
	CreateCustomer(ctx context.Context, customer *model.Customer) (*model.Customer, error)
	GetCustomerByID(ctx context.Context, id uint) (*model.Customer, error)
	GetCustomerByCode(ctx context.Context, code string) (*model.Customer, error)
	GetCustomerByUniqueFields(ctx context.Context, code, nikename, mobile, shenasemeli string, bidID uint) (*model.Customer, error)
	CheckCustomerCodeExists(ctx context.Context, bidID uint, code string) (bool, error)
	FindOrCreateCusType(ctx context.Context, label string) (*model.CusType, error)
	GetAllCustomers(ctx context.Context) ([]model.Customer, error)
	UpdateCustomer(ctx context.Context, id uint, req *model.UpdateCustomerRequest) (*model.Customer, error)
	DeleteCustomer(ctx context.Context, id uint) error
	GetAllCustomerTypes(ctx context.Context) ([]model.CusType, error)
	FindCusTypeByLabel(ctx context.Context, label string) (*model.CusType, error)
	CreateCustomerType(ctx context.Context, cusType *model.CusType) (*model.CusType, error)
	IsCustomerTypeInUse(ctx context.Context, code string) (bool, error)
	DeleteCustomerTypeByCode(ctx context.Context, code string) error
	SearchCustomers(ctx context.Context, req *model.CustomerSearchRequest) (*model.SearchResponse, error)
}
