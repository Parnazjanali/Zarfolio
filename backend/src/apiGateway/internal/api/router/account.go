package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpAccountRoutes(apiGroup fiber.Router, accountHandlerAG *handler.AccountHandlerAG, authMiddleware *middleware.AuthMiddleware, logger *zap.Logger) error {
	defer logger.Sync() 

	if apiGroup == nil {
		logger.Error("apiGroup is nil in SetUpAccountRoutes",
			zap.String("service", "server"),
			zap.String("operation", "setup-account-routes"))
		return fmt.Errorf("apiGroup cannot be nil in SetUpAccountRoutes")
	}

	if accountHandlerAG == nil {
		logger.Error("AccountHandlerAG is nil in SetUpAccountRoutes",
			zap.String("service", "server"),
			zap.String("operation", "setup-account-routes"))
		return fmt.Errorf("AccountHandlerAG cannot be nil in SetUpAccountRoutes")
	}

	if authMiddleware == nil {
		logger.Error("AuthMiddleware is nil in SetUpAccountRoutes",
			zap.String("service", "server"),
			zap.String("operation", "setup-account-routes"))
		return fmt.Errorf("AuthMiddleware cannot be nil in SetUpAccountRoutes")
	}

	if logger == nil {
		return fmt.Errorf("logger cannot be nil in SetUpAccountRoutes")
	}

	accountGroup := apiGroup.Group("/account")
	logger.Debug("Configuring /api/v1/account protected routes",
		zap.String("service", "server"),
		zap.String("operation", "setup-account-routes"))

	accountGroup.Post("/change-username", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleChangeUsername)
	accountGroup.Post("/change-password", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleChangePassword)
	accountGroup.Post("/profile-picture", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleProfilePictureUpload)

	twoFASetupGroup := accountGroup.Group("/2fa")
	twoFASetupGroup.Post("/generate-secret", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleGenerateTwoFASetup)
	twoFASetupGroup.Post("/enable", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleVerifyAndEnableTwoFA)
	twoFASetupGroup.Post("/disable", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleDisableTwoFA)

	logger.Debug("/account routes and /account/2fa routes configured successfully with RBAC",
		zap.String("service", "server"),
		zap.String("operation", "setup-account-routes"))
	return nil
}
