package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model" 
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetUpCrmRoutes(apiGroup fiber.Router, crmHandlerAG *handler.CrmHandler, authMiddleware *middleware.AuthMiddleware) error {
	if crmHandlerAG == nil {
		return fmt.Errorf("CrmHandlerAG is nil in SetUpCrmRoutes")
	}
	if authMiddleware == nil {
		return fmt.Errorf("AuthMiddleware is nil in SetUpCrmRoutes")
	}

	crmGroup := apiGroup.Group("/crm") 
	utils.Log.Info("Configuring /api/v1/crm protected routes.")

	 crmGroup.Use(authMiddleware.VerifyServiceToken())

	crmGroup.Get("/customers", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomers)     
	crmGroup.Post("/customers", authMiddleware.AuthorizeMiddleware(model.PermCRMCreateCustomer), crmHandlerAG.HandleCreateCustomer)
	crmGroup.Put("/customers/:id", authMiddleware.AuthorizeMiddleware(model.PermCRMUpdateCustomer), crmHandlerAG.HandleUpdateCustomer)
	crmGroup.Delete("/customers/:id", authMiddleware.AuthorizeMiddleware(model.PermCRMDeleteCustomer), crmHandlerAG.HandleDeleteCustomer)

	

	// روت‌های اطلاعات/جستجو و فیلترهای پیشرفته
	crmGroup.Get("/customer-types", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerTypes)
	crmGroup.Get("/customers/:code", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerInfoByCode)
	crmGroup.Get("/customer-prelabels", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerPrelabels)

	// روت‌های لیست/جستجوی پیشرفته
	crmGroup.Post("/customers/search", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleSearchCustomers)
	crmGroup.Post("/customers/filter", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleFilterCustomers)
	crmGroup.Get("/customers/salespersons", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetSalespersons) // این ممکن است PermCRMReadSalesperson نیاز داشته باشد اگر جداست


	// روت‌های عملیات گروهی
	crmGroup.Post("/customers/group-update", authMiddleware.AuthorizeMiddleware(model.PermCRMUpdateCustomer), crmHandlerAG.HandleGroupUpdateCustomers)
	crmGroup.Post("/customers/group-delete", authMiddleware.AuthorizeMiddleware(model.PermCRMDeleteCustomer), crmHandlerAG.HandleGroupDeleteCustomers)


	// روت‌های گزارش‌گیری مالی مربوط به اشخاص (بدهکاران/بستانکاران)
	crmGroup.Get("/customers/debtors/:amount", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetDebtorCustomers) // تغییر: از PermCRMViewCustomerBalance استفاده شود
	crmGroup.Get("/customers/depositors/:amount", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetDepositorCustomers) // تغییر


	// روت‌های Import/Export (ممکن است PermReportExportData باشد)
	crmGroup.Post("/customers/import-excel", authMiddleware.AuthorizeMiddleware(model.PermCRMCreateCustomer), crmHandlerAG.HandleImportCustomersExcel) // یا PermReportImportData
	crmGroup.Post("/customers/export-excel", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomersExcel)
	crmGroup.Post("/customers/export-pdf", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomersPdf)
	crmGroup.Post("/customers/import-excel",authMiddleware.AuthorizeMiddleware(model.PermReportImportData),crmHandlerAG.HandleImportCustomersExcel)

	// روت‌های مربوط به کارت حساب و تراکنش‌های شخص
	crmGroup.Post("/customers/:code/export-card-excel", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomerCardExcel)
	crmGroup.Post("/customers/:code/export-card-pdf", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomerCardPdf)

	crmGroup.Get("/customers/by-salesperson/:salespersonId", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomersBySalesperson)

	// روت برای گرفتن تراز مالی مشتری
	crmGroup.Get("/customers/:code/balance", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetCustomerBalance)

	// روت برای گرفتن کارت‌های بانکی مشتری
	crmGroup.Get("/customers/:code/bank-cards", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerCard)


	utils.Log.Info("/crm routes configured with RBAC.")
	return nil
}