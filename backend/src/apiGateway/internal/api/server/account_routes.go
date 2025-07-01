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

func SetUpAccountRoutes(app *fiber.App, accountHandlerAG *handler.AccountHandlerAG, permissionService *service.PermissionService, logger *zap.Logger) error {

	if accountHandlerAG == nil {
		return fmt.Errorf("AccountHandlerAG is nil in SetUpAccountRoutes")
	}
	if permissionService == nil {
		return fmt.Errorf("PermissionService is nil in SetUpAccountRoutes")
	}

	api := app.Group("/api/v1") 
	authMiddleware := middleware.NewAuthMiddleware(permissionService, logger)

	accountGroup := api.Group("/account")
	utils.Log.Info("Configuring /api/v1/account protected routes.")

	accountGroup.Post("/change-username", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleChangeUsername)
	accountGroup.Post("/change-password", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleChangePassword)
	accountGroup.Post("/profile-picture", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleProfilePictureUpload)

	twoFASetupGroup := accountGroup.Group("/2fa")
	twoFASetupGroup.Post("/generate-secret", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleGenerateTwoFASetup)
	twoFASetupGroup.Post("/enable", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleVerifyAndEnableTwoFA)
	twoFASetupGroup.Post("/disable", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), accountHandlerAG.HandleDisableTwoFA)

	utils.Log.Info("/account routes and /account/2fa routes configured with RBAC.")
	return nil
}
