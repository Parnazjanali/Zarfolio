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
        return fmt.Errorf("CrmHandlerAG is nil in SetUpCrmRoutes")
    }
    if authMiddleware == nil {
        return fmt.Errorf("AuthMiddleware is nil in SetUpCrmRoutes")
    }

    crmGroup := apiGroup.Group("/crm")
    logger.Debug("Configuring /api/v1/crm protected routes")

    // ===================================================================
    // روت‌های خاص و استاتیک باید اول تعریف شوند
    // ===================================================================

    // روت‌های لیست/جستجوی پیشرفته
    crmGroup.Post("/customers/search", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleSearchCustomers)
    crmGroup.Post("/customers/filter", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleFilterCustomers)

    // روت‌های عملیات گروهی
    crmGroup.Post("/customers/group-update", authMiddleware.AuthorizeMiddleware(model.PermCRMUpdateCustomer), crmHandlerAG.HandleGroupUpdateCustomers)
    crmGroup.Post("/customers/group-delete", authMiddleware.AuthorizeMiddleware(model.PermCRMDeleteCustomer), crmHandlerAG.HandleGroupDeleteCustomers)

    // روت‌های Import/Export
    crmGroup.Post("/customers/import-excel", authMiddleware.AuthorizeMiddleware(model.PermCRMCreateCustomer), crmHandlerAG.HandleImportCustomersExcel)
    crmGroup.Get("/customers/export-excel", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomersExcel)
    crmGroup.Get("/customers/export-pdf", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomersPdf)

    // روت مشتریان بر اساس فروشنده
    crmGroup.Get("/customers/by-salesperson/:salespersonId", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomersBySalesperson)
    
    // ===================================================================
    // روت‌های اصلی CRUD و روت‌های داینامیک بعد از موارد خاص تعریف می‌شوند
    // ===================================================================

    crmGroup.Get("/customers", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetAllCustomers)
    crmGroup.Post("/customers", authMiddleware.AuthorizeMiddleware(model.PermCRMCreateCustomer), crmHandlerAG.HandleCreateCustomer)
    crmGroup.Put("/customers/:id", authMiddleware.AuthorizeMiddleware(model.PermCRMUpdateCustomer), crmHandlerAG.HandleUpdateCustomer)
    crmGroup.Delete("/customers/:id", authMiddleware.AuthorizeMiddleware(model.PermCRMDeleteCustomer), crmHandlerAG.HandleDeleteCustomer)
    
    // روت داینامیک :code در انتها قرار می‌گیرد تا با روت‌های خاص تداخل نداشته باشد
    crmGroup.Get("/customers/:code", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerByCode)
    
    // روت‌های کارت حساب و تراکنش‌ها
    crmGroup.Post("/customers/:code/export-card-excel", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomerCardExcel)
    crmGroup.Post("/customers/:code/export-card-pdf", authMiddleware.AuthorizeMiddleware(model.PermReportExportData), crmHandlerAG.HandleExportCustomerCardPdf)
    
    // روت برای تراز مالی و کارت‌های بانکی
    crmGroup.Get("/customers/:code/balance", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetCustomerBalance)
    crmGroup.Get("/customers/:code/bank-cards", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerCard)

    // روت‌های گزارش‌گیری مالی
    crmGroup.Get("/customers/debtors/:amount", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetDebtorCustomers)
    crmGroup.Get("/customers/depositors/:amount", authMiddleware.AuthorizeMiddleware(model.PermCRMViewCustomerBalance), crmHandlerAG.HandleGetDepositorCustomers)

    // روت‌های مربوط به انواع مشتری
    crmGroup.Get("/customer-types", authMiddleware.AuthorizeMiddleware(model.PermCRMReadCustomer), crmHandlerAG.HandleGetCustomerTypes)
    crmGroup.Post("/customer-types", authMiddleware.AuthorizeMiddleware(model.PermCRMCreateCustomer), crmHandlerAG.HandleCreateCustomerType)
    crmGroup.Delete("/customer-types", authMiddleware.AuthorizeMiddleware(model.PermCRMDeleteCustomer), crmHandlerAG.HandleDeleteCustomerTypes)
    
    logger.Debug("CRM routes configured with RBAC")
    return nil
}