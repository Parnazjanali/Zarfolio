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
	permissionService *authz.PermissionService,
	profileHandlerAG *handler.ProfileHandler,
	proxyHandler *proxy.ProxyHandler,
) error {
	if app == nil {
		return fmt.Errorf("fiber app instance is nil in SetupAllRoutes")
	}
	if authHandler == nil {
		return fmt.Errorf("AuthHandler is nil in SetupAllRoutes")
	}
	if accountHandlerAG == nil {
		return fmt.Errorf("AccountHandlerAG is nil in SetupAllRoutes")
	}
	if crmHandlerAG == nil {
		return fmt.Errorf("CrmHandlerAG is nil in SetupAllRoutes")
	}
	if permissionService == nil {
		return fmt.Errorf("PermissionService is nil in SetupAllRoutes")
	}
	if profileHandlerAG == nil {
		return fmt.Errorf("ProfileHandlerAG is nil in SetupAllRoutes")
	}
	if proxyHandler == nil {
		return fmt.Errorf("ProxyHandler is nil in SetupAllRoutes")
	}

	apiV1 := app.Group("/api/v1")
	utils.Log.Info("Base API group /api/v1 created.")

	authMiddleware := middleware.NewAuthMiddleware(permissionService, utils.Log)

	if err := SetUpAuthRoutes(apiV1, authHandler, authMiddleware); err != nil {
		return fmt.Errorf("failed to set up auth routes: %w", err)
	}

	if err := SetUpAccountRoutes(apiV1, accountHandlerAG, authMiddleware); err != nil {
		return fmt.Errorf("failed to set up account routes: %w", err)
	}

	if err := SetUpUserManagementRoutes(apiV1, profileHandlerAG, authMiddleware); err != nil {
		return fmt.Errorf("failed to set up user management routes: %w", err)
	}
	if err := SetUpCrmRoutes(apiV1, crmHandlerAG, authMiddleware); err != nil {
		return fmt.Errorf("failed to set up CRM routes: %w", err)
	}

	profileManagerServiceURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerServiceURL != "" {

		apiV1.Get("/uploads/*", proxyHandler.HandleStaticFileProxy(profileManagerServiceURL))
		utils.Log.Info("Configured GET proxy for /api/v1/uploads/* to profileManager", zap.String("profile_manager_url", profileManagerServiceURL))
	} else {
		utils.Log.Warn("PROFILE_MANAGER_BASE_URL not set in env. Cannot configure proxy for profile pictures/uploads.")
	}

	crmManagerServiceURL := os.Getenv("CRM_MANAGER_BASE_URL")
	if crmManagerServiceURL != "" {
		apiV1.Get("/crm/uploads/*", proxyHandler.HandleStaticFileProxy(crmManagerServiceURL))
		utils.Log.Info("Configured GET proxy for /api/v1/crm/uploads/* to CRM Manager", zap.String("crm_manager_url", crmManagerServiceURL))
	} else {
		utils.Log.Warn("CRM_MANAGER_BASE_URL not set in env. Cannot configure proxy for CRM uploads.")
	}

	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("API Gateway: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "API Gateway: The requested resource was not found."})
	})
	utils.Log.Info("API Gateway: 404 fallback route configured.")

	return nil
}
