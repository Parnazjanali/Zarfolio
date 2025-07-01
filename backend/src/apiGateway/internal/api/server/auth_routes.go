package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"   
	"gold-api/internal/service" 
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpAuthRoutes(app *fiber.App, authHandler *handler.AuthHandler, permissionService *service.PermissionService, logger *zap.Logger) error {

	if authHandler == nil {
		return fmt.Errorf("AuthHandler is nil in SetUpAuthRoutes")
	}
	if permissionService == nil {
		return fmt.Errorf("PermissionService is nil in SetUpAuthRoutes")
	}

	api := app.Group("/api/v1") 
	authMiddleware := middleware.NewAuthMiddleware(permissionService, logger)

	authGroup := api.Group("/auth")
	utils.Log.Info("Configuring /api/v1/auth routes.")

	authGroup.Post("/register", authHandler.RegisterUser)
	authGroup.Post("/login", authHandler.LoginUser)
	authGroup.Post("/password/request-reset", authHandler.HandleRequestPasswordReset)
	authGroup.Post("/password/reset", authHandler.HandleResetPassword)
	authGroup.Post("/2fa/verify", authHandler.HandleLoginTwoFA)
	authGroup.Post("/logout", authMiddleware.AuthorizeMiddleware(model.PermUserRead), authHandler.LogoutUser)

	utils.Log.Info("Public authentication routes configured.")
	return nil
}
