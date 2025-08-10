
package server

import (
	"fmt"
	"gold-api/internal/api/authz"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/api/proxy"
	"gold-api/internal/service/auth"
	"gold-api/internal/service/crm"
	crmmanager "gold-api/internal/service/crmManager"
	profilemanager "gold-api/internal/service/profilemanger"
	"os"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func StartServer(address string, logger *zap.Logger) error {
	defer logger.Sync()

	if address == "" {
		logger.Error("Server address is empty",
			zap.String("service", "api-gateway"),
			zap.String("operation", "start-server"))
		return fmt.Errorf("server address cannot be empty")
	}

	app := fiber.New()
	logger.Debug("Fiber app instance created",
		zap.String("service", "api-gateway"),
		zap.String("operation", "start-server"))

	app.Use(middleware.CorsMiddleware())
	logger.Debug("CORS middleware applied",
		zap.String("service", "api-gateway"),
		zap.String("operation", "start-server"))

	profileManagerBaseURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerBaseURL == "" {
		logger.Error("PROFILE_MANAGER_BASE_URL is not set",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"))
		return fmt.Errorf("PROFILE_MANAGER_BASE_URL is not set")
	}

	crmManagerBaseURL := os.Getenv("CRM_MANAGER_BASE_URL")
	if crmManagerBaseURL == "" {
		logger.Error("CRM_MANAGER_BASE_URL is not set",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"))
		return fmt.Errorf("CRM_MANAGER_BASE_URL is not set")
	}

	logger.Debug("Environment variables loaded",
		zap.String("service", "api-gateway"),
		zap.String("operation", "init-services"),
		zap.String("profile_manager_url", profileManagerBaseURL),
		zap.String("crm_manager_url", crmManagerBaseURL))

	profileManagerClient, err := profilemanager.NewClient(profileManagerBaseURL, logger)
	if err != nil {
		logger.Error("Failed to initialize ProfileManagerClient",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"),
			zap.Error(err))
		return fmt.Errorf("failed to initialize ProfileManagerClient: %w", err)
	}

	permissionService := authz.NewPermissionService(logger)
	if permissionService == nil {
		logger.Error("Failed to initialize PermissionService",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"))
		return fmt.Errorf("failed to initialize PermissionService")
	}

	authSvc, err := auth.NewAuthService(profileManagerClient, logger)
	if err != nil {
		logger.Error("Failed to initialize AuthService",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"),
			zap.Error(err))
		return fmt.Errorf("failed to initialize AuthService: %w", err)
	}

	authHandler, err := handler.NewAuthHandler(authSvc, logger)
	if err != nil {
		logger.Error("Failed to initialize AuthHandler",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"),
			zap.Error(err))
		return fmt.Errorf("failed to initialize AuthHandler: %w", err)
	}

	accountHandlerAG := handler.NewAccountHandlerAG(profileManagerClient)
	if accountHandlerAG == nil {
		logger.Error("Failed to initialize AccountHandlerAG",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"))
		return fmt.Errorf("failed to initialize AccountHandlerAG")
	}

	profileHandlerAG := handler.NewProfileHandler(profileManagerClient)
	if profileHandlerAG == nil {
		logger.Error("Failed to initialize ProfileHandler",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"))
		return fmt.Errorf("failed to initialize ProfileHandler")
	}

	crmManagerClient, err := crmmanager.NewCrmManagerClient(crmManagerBaseURL, logger)
	if err != nil {
		logger.Error("Failed to initialize CrmManagerClient",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"),
			zap.Error(err))
		return fmt.Errorf("failed to initialize CrmManagerClient: %w", err)
	}

	crmSvc, err := crm.NewCrmService(crmManagerClient, logger)
	if err != nil {
		logger.Error("Failed to initialize CrmService",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"),
			zap.Error(err))
		return fmt.Errorf("failed to initialize CrmService: %w", err)
	}

	crmHandlerAG, err := handler.NewCrmHandler(crmSvc, logger)
	if err != nil {
		logger.Error("Failed to initialize CrmHandlerAG",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"),
			zap.Error(err))
		return fmt.Errorf("failed to initialize CrmHandlerAG: %w", err)
	}

	proxyHandler := proxy.NewProxyHandler(logger)
	if proxyHandler == nil {
		logger.Error("Failed to initialize ProxyHandler",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-services"))
		return fmt.Errorf("failed to initialize ProxyHandler")
	}

	if err := SetupAllRoutes(
		app,
		authHandler,
		accountHandlerAG,
		crmHandlerAG,
		permissionService,
		profileHandlerAG,
		proxyHandler,
		logger,
	); err != nil {
		logger.Error("Failed to set up API routes",
			zap.String("service", "api-gateway"),
			zap.String("operation", "init-routes"),
			zap.Error(err))
		return fmt.Errorf("failed to set up API routes: %w", err)
	}

	logger.Debug("API Gateway is starting",
		zap.String("service", "api-gateway"),
		zap.String("operation", "start-server"),
		zap.String("address", address))

	if err := app.Listen(address); err != nil {
		logger.Error("Failed to start server",
			zap.String("service", "api-gateway"),
			zap.String("operation", "start-server"),
			zap.String("address", address),
			zap.Error(err))
		return fmt.Errorf("failed to listen: %w", err)
	}

	return nil
}
