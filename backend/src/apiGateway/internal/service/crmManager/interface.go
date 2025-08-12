package crmmanager

import (
	"context"
	"gold-api/internal/model"
)

type CrmManagerClient interface {
	GetAllCustomers(ctx context.Context) ([]model.Customer, error)
	CreateCustomer(ctx context.Context, customer *model.CreateCustomerRequest) (*model.Customer, error)
	UpdateCustomer(ctx context.Context, id string, req *model.UpdateCustomerRequest) (*model.Customer, error)
	DeleteCustomer(ctx context.Context, id string) error
	GetCustomerTypes(ctx context.Context) ([]model.CusType, error)
	CreateCustomerTypes(ctx context.Context, label string) (*model.CusType, error)
	DeleteCustomerTypes(ctx context.Context, code string)error
	/*	GetCustomerInfoByCode(code string) (*model.Customer, error)
		GetCustomerPrelabels() ([]model.CustomerPrelabel, error)
		SearchCustomers(req model.SearchCustomersRequest) ([]model.Customer, error)
		FilterCustomers(req model.FilterCustomersRequest) ([]model.Customer, error)
		GetSalespersons() ([]model.Salesperson, error)
		GroupUpdateCustomers(req model.GroupUpdateCustomersRequest) error
		GroupDeleteCustomers(req model.GroupDeleteCustomersRequest) error
		GetDebtorCustomers(amount float64) ([]model.Customer, error)
		GetDepositorCustomers(amount float64) ([]model.Customer, error)
		ImportCustomersExcel(fileContent []byte) error
		ExportCustomersExcel() ([]byte, error)
		ExportCustomersPdf() ([]byte, error)
		ExportCustomerCardExcel(code string) ([]byte, error)
		ExportCustomerCardPdf(code string) ([]byte, error)*/

	BaseUrl() string
}
