package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpCrmRoutes(
	apiGroup fiber.Router,
	crmHandlerAG *handler.CrmHandler,
	authMiddleware *middleware.AuthMiddleware,
	logger *zap.Logger,
) error {
	defer logger.Sync()

	if crmHandlerAG == nil {
		logger.Error("CrmHandlerAG is nil",
			zap.String("service", "api-gateway"),
			zap.String("route_group", "crm"))
		return fmt.Errorf("CrmHandlerAG is nil in SetUpCrmRoutes")
	}
	if authMiddleware == nil {
		logger.Error("AuthMiddleware is nil",
			zap.String("service", "api-gateway"),
			zap.String("route_group", "crm"))
		return fmt.Errorf("AuthMiddleware is nil in SetUpCrmRoutes")
	}

	crmGroup := apiGroup.Group("/crm")
	logger.Debug("Configuring /api/v1/crm protected routes",
		zap.String("service", "api-gateway"),
		zap.String("route_group", "crm"))

	crmGroup.Get("/customers", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetAllCustomers)
	crmGroup.Post("/customers", authMiddleware.AuthorizeMiddleware(model.PermCRMCreateCustomer), crmHandlerAG.HandleCreateCustomer)
	crmGroup.Put("/customers/:id", authMiddleware.AuthorizeMiddleware(model.PermCRMUpdateCustomer), crmHandlerAG.HandleUpdateCustomer)
	crmGroup.Delete("/customers/:id", authMiddleware.AuthorizeMiddleware(model.PermCRMDeleteCustomer), crmHandlerAG.HandleDeleteCustomer)

	// روت‌های اطلاعات/جستجو و فیلترهای پیشرفته
	crmGroup.Get("/customer-types", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerTypes)
	crmGroup.Post("/customer-types", authMiddleware.AuthorizeMiddleware(model.PermCRMCreateCustomer), crmHandlerAG.HandleCreateCustomerType)
	crmGroup.Delete("/custome-types", authMiddleware.AuthorizeMiddleware(model.PermCRMDeleteCustomer), crmHandlerAG.HandleDeleteCustomerTypes)
	crmGroup.Get("/customers/:code", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerInfoByCode)
	crmGroup.Get("/customer-prelabels", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerPrelabels)

	// روت‌های لیست/جستجوی پیشرفته
	crmGroup.Post("/customers/search", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleSearchCustomers)
	crmGroup.Post("/customers/filter", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleFilterCustomers)
	crmGroup.Get("/customers/salespersons", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetSalespersons)

	// روت‌های عملیات گروهی
	crmGroup.Post("/customers/group-update", authMiddleware.AuthorizeMiddleware(model.PermCRMUpdateCustomer), crmHandlerAG.HandleGroupUpdateCustomers)
	crmGroup.Post("/customers/group-delete", authMiddleware.AuthorizeMiddleware(model.PermCRMDeleteCustomer), crmHandlerAG.HandleGroupDeleteCustomers)

	// روت‌های گزارش‌گیری مالی
	crmGroup.Get("/customers/debtors/:amount", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetDebtorCustomers)
	crmGroup.Get("/customers/depositors/:amount", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetDepositorCustomers)

	// روت‌های Import/Export
	crmGroup.Post("/customers/import-excel", authMiddleware.AuthorizeMiddleware(model.PermCRMCreateCustomer), crmHandlerAG.HandleImportCustomersExcel)
	crmGroup.Post("/customers/export-excel", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomersExcel)
	crmGroup.Post("/customers/export-pdf", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomersPdf)
	crmGroup.Post("/customers/import-excel", authMiddleware.AuthorizeMiddleware(model.PermReportImportData), crmHandlerAG.HandleImportCustomersExcel)

	// روت‌های کارت حساب و تراکنش‌ها
	crmGroup.Post("/customers/:code/export-card-excel", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomerCardExcel)
	crmGroup.Post("/customers/:code/export-card-pdf", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomerCardPdf)

	crmGroup.Get("/customers/by-salesperson/:salespersonId", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomersBySalesperson)

	// روت برای تراز مالی و کارت‌های بانکی
	crmGroup.Get("/customers/:code/balance", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetCustomerBalance)
	crmGroup.Get("/customers/:code/bank-cards", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerCard)

	logger.Debug("CRM routes configured with RBAC",
		zap.String("service", "api-gateway"),
		zap.String("route_group", "crm"))

	return nil
}
