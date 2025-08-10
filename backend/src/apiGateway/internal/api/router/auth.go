package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpAuthRoutes(apiGroup fiber.Router, authHandler *handler.AuthHandler, authMiddleware *middleware.AuthMiddleware, logger *zap.Logger) error {
	defer logger.Sync() 
	
	if apiGroup == nil {
		logger.Error("apiGroup is nil in SetUpAuthRoutes",
			zap.String("service", "server"),
			zap.String("operation", "setup-auth-routes"))
		return fmt.Errorf("apiGroup cannot be nil in SetUpAuthRoutes")
	}

	if authHandler == nil {
		logger.Error("AuthHandler is nil in SetUpAuthRoutes",
			zap.String("service", "server"),
			zap.String("operation", "setup-auth-routes"))
		return fmt.Errorf("AuthHandler cannot be nil in SetUpAuthRoutes")
	}

	if authMiddleware == nil {
		logger.Error("AuthMiddleware is nil in SetUpAuthRoutes",
			zap.String("service", "server"),
			zap.String("operation", "setup-auth-routes"))
		return fmt.Errorf("AuthMiddleware cannot be nil in SetUpAuthRoutes")
	}

	if logger == nil {
		return fmt.Errorf("logger cannot be nil in SetUpAuthRoutes")
	}

	authGroup := apiGroup.Group("/auth")
	logger.Debug("Configuring /api/v1/auth routes",
		zap.String("service", "server"),
		zap.String("operation", "setup-auth-routes"))

	authGroup.Post("/register", authHandler.RegisterUser)
	authGroup.Post("/login", authHandler.LoginUser)
	authGroup.Post("/password/request-reset", authHandler.HandleRequestPasswordReset)
	authGroup.Post("/password/reset", authHandler.HandleResetPassword)
	authGroup.Post("/2fa/verify", authHandler.HandleLoginTwoFA)
	authGroup.Post("/logout", authHandler.LogoutUser)

	logger.Debug("Authentication routes configured successfully",
		zap.String("service", "server"),
		zap.String("operation", "setup-auth-routes"))
	return nil
}
