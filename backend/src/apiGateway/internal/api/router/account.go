package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetUpAccountRoutes(apiGroup fiber.Router, accountHandlerAG *handler.AccountHandlerAG, authMiddleware *middleware.AuthMiddleware) error {
	if accountHandlerAG == nil {
		return fmt.Errorf("AccountHandlerAG is nil in SetUpAccountRoutes")
	}
	if authMiddleware == nil {
		return fmt.Errorf("AuthMiddleware is nil in SetUpAccountRoutes")
	}

	accountGroup := apiGroup.Group("/account")
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
