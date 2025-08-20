package router

import (
	"crm-gold/internal/api/authz"
	"crm-gold/internal/api/handler"
	"crm-gold/internal/api/middleware"
	"crm-gold/internal/repository/db/postgresDb"
	customerService "crm-gold/internal/service/customer"
	"crm-gold/internal/utils"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)
func StartServer(port string) error {
    utils.Log.Info("Initializing CrmManager Fiber Server...")

    app := fiber.New()
    utils.Log.Info("Crm Manager Fiber app instance created successfully.")
	
    app.Use(middleware.CorsMiddleware())
    utils.Log.Info("CORS middleware applied to the Fiber app.")
    if app == nil {
        return fmt.Errorf("fiber app instance cannot be nil in CrmManager.")
    }
    utils.Log.Info("Setting up routes for CrmManager...")

    // This section remains the same, initializing dependencies
    permissionService, err := authz.NewPermissionService(utils.Log)
    if err != nil {
        utils.Log.Fatal("Failed to initialize PermissionService. Exiting application.", zap.Error(err))
    }
    jwtValidator := utils.NewJWTValidatorImpl()
    customerRepo, err := postgresDb.NewCustomerRepository(postgresDb.DB, utils.Log)
    if err != nil {
        utils.Log.Fatal("Failed to initialize customer repository", zap.Error(err))
    }
    customerService, err := customerService.NewCustomerService(customerRepo, utils.Log)
    if err != nil {
        utils.Log.Fatal("Failed to initialize customer service", zap.Error(err))
    }
    crmHandler := handler.NewCrmHandler(customerService)
    if crmHandler == nil {
        utils.Log.Fatal("Failed to initialize CrmHandler", zap.Error(fmt.Errorf("crmHandler cannot be nil")))
    }
    authZMiddlewareForCRM, err := middleware.NewAuthZMiddleware(permissionService, utils.Log, jwtValidator)
    if err != nil {
        utils.Log.Fatal("Failed to initialize AuthZMiddleware for CRM", zap.Error(err))
    }

    if err := SetUpAllRoutes(app, crmHandler, authZMiddlewareForCRM); err != nil {
        utils.Log.Fatal("CRM Manager Service failed to start Fiber server", zap.Error(err))
    }

    app.Use(func(c *fiber.Ctx) error {
        utils.Log.Warn("Route not found", zap.String("path", c.OriginalURL()))
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Route not found."})
    })

    fullAddr := fmt.Sprintf("0.0.0.0%s", port)
    utils.Log.Info("Crm Manager is attempting to listen", zap.String("address", fullAddr))
    return app.Listen(port)
}