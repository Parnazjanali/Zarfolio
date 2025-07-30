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
	CheckCustomerCodeExists(ctx context.Context, bidID uint, code string) (bool, error) // برای generateUniqueCustomerCode
	GetAllCustomers(ctx context.Context) ([]model.Customer, error) // برای HandleGetCustomers
	// ... سایر متدهای CRUD (Update, Delete, ListWithFilters)
}