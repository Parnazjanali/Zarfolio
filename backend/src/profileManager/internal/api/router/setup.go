package router

import (
	"fmt"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/api/middleware"
	"profile-gold/internal/model"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)
func SetupAllRoutes(app *fiber.App, authHandler *handler.AuthHandler, accountHandler *handler.AccountHandler, userHandler *handler.UserHandler, authZMiddleware *middleware.AuthZMiddleware) error {
    if app == nil {
        return fmt.Errorf("fiber app instance is nil in SetupAllRoutes")
    }
    if authHandler == nil {
        return fmt.Errorf("AuthHandler is nil in SetupAllRoutes")
    }
    if accountHandler == nil {
        return fmt.Errorf("accountHandler is nil in SetupAllRoutes")
    }
    if userHandler == nil {
        return fmt.Errorf("userHandleris nil in SetupAllRoutes")
    }
    if authZMiddleware == nil {
        return fmt.Errorf("authZMiddleware is nil in SetupAllRoutes")
    }

    utils.Log.Info("Profile Manager: Setting up all routes.")
	// --- Set up Auth Routes ---
	if err := SetuUpAuthRoutes(app, authHandler); err != nil { 
		return fmt.Errorf("failed to set up auth routes: %w", err)
	}

	// --- Set up Account Routes ---
	if err := SetUpAccountRoutes(app, accountHandler, authZMiddleware); err != nil {
		return fmt.Errorf("failed to set up account routes: %w", err)
	}

	// --- Set up User Management Routes ---
	if err := SetUpUserManagementRoutes(app, userHandler, authZMiddleware); err != nil {
		return fmt.Errorf("failed to set up user management routes: %w", err)
	}

	// ... Fallback 404 handler (if needed in Profile Manager)
	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("Profile Manager: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "Profile Manager: The requested resource was not found."}) 
	})

	return nil
}
