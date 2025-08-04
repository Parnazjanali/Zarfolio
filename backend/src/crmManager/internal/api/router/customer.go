package router

import (
	"crm-gold/internal/api/handler"
	"crm-gold/internal/utils"
	"fmt"

	"github.com/gofiber/fiber/v2"

)

func SetUpCustomerRoutes(app *fiber.App, crmHandler *handler.CrmHandler) error {
	if app == nil {
		return fmt.Errorf("fiber app instance cannot be nil in CrmManager.")
	}
	if crmHandler == nil {
		return fmt.Errorf("crmHandler is nil in CrmManager's SetUpCustomerRoutes.")
	}

	crmGroup := app.Group("/crm") 
	utils.Log.Info("Setting up customer routes in CrmManager...")

	crmGroup.Get("/customer", crmHandler.HandleGetCustomers)
	crmGroup.Post("/customers", crmHandler.HandleCreateCustomer)
	/*crmGroup.Put("/customers/:id", crmHandler.HandleUpdateCustomer)
	crmGroup.Delete("/customers/:id", crmHandler.HandleDeleteCustomer)

	crmGroup.Get("/customer-types", crmHandler.HandleGetCustomerTypes)
	crmGroup.Get("/customers/:code", crmHandler.HandleGetCustomerInfoByCode)
	crmGroup.Get("/customer-prelabels", crmHandler.HandleGetCustomerPrelabels)

	crmGroup.Post("/customers/search", crmHandler.HandleSearchCustomers)
	crmGroup.Post("/customers/filter", crmHandler.HandleFilterCustomers)
	crmGroup.Get("/customers/salespersons", crmHandler.HandleGetCustomersBySalesperson) 


	crmGroup.Post("/customers/group-update", crmHandler.HandleGroupUpdateCustomers)
	crmGroup.Post("/customers/group-delete", crmHandler.HandleGroupDeleteCustomers)


	crmGroup.Get("/customers/debtors/:amount", crmHandler.HandleGetDebtorCustomers)
	crmGroup.Get("/customers/depositors/:amount", crmHandler.HandleGetDepositorCustomers)


	crmGroup.Post("/customers/import-excel", crmHandler.HandleImportCustomersExcel)
	crmGroup.Post("/customers/export-excel", crmHandler.HandleExportCustomersExcel)
	crmGroup.Post("/customers/export-pdf", crmHandler.HandleExportCustomersPdf)

	crmGroup.Post("/customers/:code/export-card-excel", crmHandler.HandleExportCustomerCardExcel)
	crmGroup.Post("/customers/:code/export-card-pdf", crmHandler.HandleExportCustomerCardPdf)

	crmGroup.Get("/customers/:code/balance", crmHandler.HandleGetCustomerBalance)
	crmGroup.Get("/customers/:code/bank-cards", crmHandler.HandleGetCustomerCard)*/


	utils.Log.Info("Customer routes set up successfully in CrmManager.")
	return nil
}