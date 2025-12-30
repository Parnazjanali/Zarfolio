package router

import (
	"fmt"
	"os"
	"transaction-gold/internal/api/authz"
	"transaction-gold/internal/api/handler"
	"transaction-gold/internal/api/middleware"
	"transaction-gold/internal/repository/db/postgresDb"
	crmService "transaction-gold/internal/service/crm"
	inventoryService "transaction-gold/internal/service/inventory"
	transactionService "transaction-gold/internal/service/transaction"
	"transaction-gold/internal/utils"

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
		zap.String("service", "transaction-manager"),
		zap.String("operation", "start-server"))

	app.Use(middleware.CorsMiddleware())
	logger.Debug("CORS middleware applied",
		zap.String("service", "transaction-manager"),
		zap.String("operation", "start-server"))

	logger.Info("Setting up Routes for Tr Manager")

	permissionService := authz.NewPermissionService(logger)
	if permissionService == nil {
		logger.Error("permission service is nil",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"))
		return fmt.Errorf("failed to create permission service")
	}

	jwtValidator := utils.NewJWTValidatorImpl("JWT_SECRET_KEY", logger)

	transactionRepo, err := postgresDb.NewTrRepository(postgresDb.DB, logger)
	if err != nil {
		logger.Error("failed to create transaction repository",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create transaction repository: %w", err)
	}

	inventoryMangerBaseURL := os.Getenv("Inventory_Base_URL")
	if inventoryMangerBaseURL == "" {
		logger.Error("Inventory service base URL not found",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.String("Inventory_Base_URL", inventoryMangerBaseURL))
	}

	crmManagerBaseURL := os.Getenv("CRM_Base_URL")
	if crmManagerBaseURL == "" {
		logger.Error("CRM service base URL not found",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.String("CRM_Base_URL", crmManagerBaseURL))
	}

	inventoryManagerClient, err := inventoryService.NewInventoryManagerClient(inventoryMangerBaseURL, logger)
	if err != nil {
		logger.Error("failed to Initialize inventory manager client",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create inventory manager client: %w", err)
	}

	crmManagerClient, err := crmService.NewCrmManagerClient(crmManagerBaseURL, logger)
	if err != nil {
		logger.Error("failed to Initialize CRM manager client",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create CRM manager client: %w", err)
	}

	transactionService, err := transactionService.NewTrService(transactionRepo, inventoryManagerClient, crmManagerClient, logger)
	if err != nil {
		logger.Error("failed to create transaction service",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create transaction service: %w", err)
	}
	transactionHandler, err := handler.NewTransactionHandler(transactionService, logger)
	if err != nil {
		logger.Error("failed to create transaction handler",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create transaction handler: %w", err)
	}

	authMiddlewareForTr, err := middleware.NewAuthMiddleware(permissionService, logger, jwtValidator)
	if err != nil {
		logger.Error("failed to create auth middleware",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to create auth middleware: %w", err)
	}

	app.Use(authMiddlewareForTr.VerifyServiceToken())
	logger.Debug("Auth middleware applied",
		zap.String("service", "transaction-manager"),
		zap.String("operation", "start-server"))

	if err := setUpAllRoutes(app, transactionHandler, logger); err != nil {
		logger.Error("failed to set up all routes",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to set up all routes: %w", err)
	}

	logger.Info("Starting server...",
		zap.String("service", "transaction-manager"),
		zap.String("operation", "start-server"),
		zap.String("port", port))

	if err := app.Listen(port); err != nil {
		logger.Error("failed to start server",
			zap.String("service", "transaction-manager"),
			zap.String("operation", "start-server"),
			zap.Error(err))
		return fmt.Errorf("failed to start server: %w", err)
	}

	return nil

}
