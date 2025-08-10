package server

import (
	"fmt"
	"gold-api/internal/api/authz"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/api/proxy"
	"gold-api/internal/model"
	"gold-api/internal/utils"
	"os"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetupAllRoutes(
	app *fiber.App,
	authHandler *handler.AuthHandler,
	accountHandlerAG *handler.AccountHandlerAG,
	crmHandlerAG *handler.CrmHandler,
	permissionService authz.PermissionService,
	profileHandlerAG *handler.ProfileHandler,
	proxyHandler *proxy.ProxyHandler,
	logger *zap.Logger,
) error {

	defer logger.Sync()

	if app == nil {
		logger.Error("Fiber app instance is nil",
			zap.String("service", "api-gateway"))
		return fmt.Errorf("fiber app instance is nil in SetupAllRoutes")
	}
	if authHandler == nil {
		logger.Error("AuthHandler is nil",
			zap.String("service", "api-gateway"))
		return fmt.Errorf("AuthHandler is nil in SetupAllRoutes")
	}
	if accountHandlerAG == nil {
		logger.Error("AccountHandlerAG is nil",
			zap.String("service", "api-gateway"))
		return fmt.Errorf("AccountHandlerAG is nil in SetupAllRoutes")
	}
	if crmHandlerAG == nil {
		logger.Error("CrmHandlerAG is nil",
			zap.String("service", "api-gateway"))
		return fmt.Errorf("CrmHandlerAG is nil in SetupAllRoutes")
	}
	if permissionService == nil {
		logger.Error("PermissionService is nil",
			zap.String("service", "api-gateway"))
		return fmt.Errorf("PermissionService is nil in SetupAllRoutes")
	}
	if profileHandlerAG == nil {
		logger.Error("ProfileHandlerAG is nil",
			zap.String("service", "api-gateway"))
		return fmt.Errorf("ProfileHandlerAG is nil in SetupAllRoutes")
	}
	if proxyHandler == nil {
		logger.Error("ProxyHandler is nil",
			zap.String("service", "api-gateway"))
		return fmt.Errorf("ProxyHandler is nil in SetupAllRoutes")
	}

	apiV1 := app.Group("/api/v1")
	logger.Debug("Base API group /api/v1 created",
		zap.String("service", "api-gateway"))

	jwtValidator := utils.NewJWTValidatorImpl("JWT_SECRET_KEY", logger)

	authMiddleware, err := middleware.NewAuthMiddleware(permissionService, logger, jwtValidator)
	if err != nil {
		logger.Error("Failed to initialize AuthMiddleware",
			zap.Error(err),
			zap.String("service", "api-gateway"))
		return fmt.Errorf("failed to initialize auth middleware: %w", err)
	}
	logger.Debug("AuthMiddleware initialized successfully",
		zap.String("service", "api-gateway"))

	if err := SetUpAuthRoutes(apiV1, authHandler, authMiddleware, logger); err != nil {
		logger.Error("Failed to set up auth routes",
			zap.Error(err),
			zap.String("service", "api-gateway"))
		return fmt.Errorf("failed to set up auth routes: %w", err)
	}

	if err := SetUpAccountRoutes(apiV1, accountHandlerAG, authMiddleware, logger); err != nil {
		logger.Error("Failed to set up account routes",
			zap.Error(err),
			zap.String("service", "api-gateway"))
		return fmt.Errorf("failed to set up account routes: %w", err)
	}

	if err := SetUpCrmRoutes(apiV1, crmHandlerAG, authMiddleware, logger); err != nil {
		logger.Error("Failed to set up CRM routes",
			zap.Error(err),
			zap.String("service", "api-gateway"))
		return fmt.Errorf("failed to set up CRM routes: %w", err)
	}

	profileManagerServiceURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerServiceURL != "" {
		apiV1.Get("/uploads/*", proxyHandler.HandleStaticFileProxy(profileManagerServiceURL))
		logger.Debug("Configured GET proxy for /api/v1/uploads/* to profileManager",
			zap.String("profile_manager_url", profileManagerServiceURL),
			zap.String("service", "api-gateway"))
	} else {
		logger.Warn("PROFILE_MANAGER_BASE_URL not set in env. Cannot configure proxy for profile pictures/uploads",
			zap.String("service", "api-gateway"))
	}

	crmManagerServiceURL := os.Getenv("CRM_MANAGER_BASE_URL")
	if crmManagerServiceURL != "" {
		apiV1.Get("/crm/uploads/*", proxyHandler.HandleStaticFileProxy(crmManagerServiceURL))
		logger.Debug("Configured GET proxy for /api/v1/crm/uploads/* to CRM Manager",
			zap.String("crm_manager_url", crmManagerServiceURL),
			zap.String("service", "api-gateway"))
	} else {
		logger.Warn("CRM_MANAGER_BASE_URL not set in env. Cannot configure proxy for CRM uploads",
			zap.String("service", "api-gateway"))
	}

	app.Use(func(c *fiber.Ctx) error {
		logger.Warn("API Gateway: 404 Not Found",
			zap.String("method", c.Method()),
			zap.String("path", c.OriginalURL()),
			zap.String("requestID", c.Get("X-Request-ID")),
			zap.String("service", "api-gateway"))
		return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "API Gateway: The requested resource was not found."})
	})
	logger.Debug("API Gateway: 404 fallback route configured",
		zap.String("service", "api-gateway"))

	return nil
}
