package crm

type CrmService interface {
	HandleGetCustomers() error
	HandleCreateCustomer() error
	HandleUpdateCustomer() error
	HandleDeleteCustomer() error
	HandleGetCustomerTypes() error
	HandleGetCustomerInfoByCode() error
	HandleGetCustomerPrelabels() error
	HandleSearchCustomers() error
	HandleFilterCustomers() error
	HandleGetSalespersons() error	
	HandleGroupUpdateCustomers() error
	HandleGroupDeleteCustomers() error
	HandleGetDebtorCustomers() error
	HandleGetDepositorCustomers() error
	HandleImportCustomersExcel() error
	HandleExportCustomersExcel() error
	HandleExportCustomersPdf() error
	HandleExportCustomerCardExcel() error
	HandleExportCustomerCardPdf() error	
	
}