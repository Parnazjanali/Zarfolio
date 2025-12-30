package router

import (
	"fmt"
	"inventory-gold/internal/api/authz"
	"inventory-gold/internal/api/middleware"
	"inventory-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func StartServer(port string, logger *zap.Logger) error {
	defer logger.Sync()

	if port == "" {
		logger.Error("port can't be nil",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"))
		return fmt.Errorf("server address cannot be empty")
	}

	app := fiber.New()
	logger.Debug("Fiber app instance created",
		zap.String("service", "Inventory-manager"),
		zap.String("operation", "start-server"))

	app.Use(middleware.CorsMiddleware())
	logger.Debug("CORS middleware applied",
		zap.String("service", "Inventory-manager"),
		zap.String("operation", "start-server"))

	logger.Info("Setting up Routes for Inventory Manager")

	permissionService := authz.NewPermissionService(logger)
	if permissionService == nil {
		logger.Error("permission service is nil",
			zap.String("service", "Inventory-manager"),
			zap.String("operation", "start-server"))
		return fmt.Errorf("failed to create permission service")
	}

	jwtValidator := utils.NewJWTValidatorImpl("JWT_SECRET_KEY", logger)

	/*inventoryRepo, err := postgresDb.NewTrRepository(postgresDb.DB, logger)
	if err != nil {
		logger.Error("failed to create transaction repository",
			zap.String("service", "Inventory-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create Inventory repository: %w", err)
	}

	inventoryManagerBaseURL := os.Getenv("Inventory_Manager_Port")
	if inventoryManagerBaseURL == "" {
		logger.Error("Inventory service base URL not found",
			zap.String("service", "Inventory-manager"),
			zap.String("operation", "start-server"),
			zap.String("Inventory_Manager_Port", inventoryManagerBaseURL))
	}

	InventoryService, err := inventoryService.NewInventoryService(inventoryRepo, logger)
	if err != nil {
		logger.Error("failed to create transaction service",
			zap.String("service", "Inventory-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create transaction service: %w", err)
	}

	inventoryHandler, err := handler.NewInventoryHandler(InventoryService, logger)
	if err != nil {
		logger.Error("failed to create transaction handler",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create transaction handler: %w", err)
	}*/

	authMiddlewareForTr, err := middleware.NewAuthMiddleware(permissionService, logger, jwtValidator)
	if err != nil {
		logger.Error("failed to create auth middleware",
			zap.String("service", "Inventory-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create auth middleware: %w", err)
	}

	app.Use(authMiddlewareForTr.VerifyServiceToken())
	logger.Debug("Auth middleware applied",
		zap.String("service", "Inventory-manager"),
		zap.String("operation", "start-server"))

	/* if err := setUpAllRoutes(app, inventoryHandler, logger); err != nil {
		logger.Error("failed to set up all routes",
			zap.String("service", "Inventory-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to set up all routes: %w", err)
	}*/

	logger.Info("Starting server...",
		zap.String("service", "Inventory-manager"),
		zap.String("operation", "start-server"),
		zap.String("port", port))

	if err := app.Listen(port); err != nil {
		logger.Error("failed to start server",
			zap.String("service", "Inventory-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to start server: %w", err)
	}

	return nil

}
