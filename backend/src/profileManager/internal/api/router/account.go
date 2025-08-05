package router

import (
	"fmt"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/api/middleware" 
	"profile-gold/internal/utils"         

	"github.com/gofiber/fiber/v2"
)

func SetUpAccountRoutes(app *fiber.App, accountHandler *handler.AccountHandler, authZMiddleware *middleware.AuthZMiddleware) error {
	if app == nil {
		return fmt.Errorf("Fiber app instance is nil in Profile Manager's SetUpAccountRoutes")
	}
	if accountHandler == nil {
		return fmt.Errorf("AccountHandler is nil in Profile Manager's SetUpAccountRoutes")
	}
	if authZMiddleware == nil {
		return fmt.Errorf("AuthZMiddleware is nil in Profile Manager's SetUpAccountRoutes")
	}

	accountGroup := app.Group("/account") // API Gateway به /account/* فوروارد می‌کند.
	utils.Log.Info("Profile Manager: Configuring /account routes (for self-management).")

	// All these routes require internal token verification.
	// Further authorization logic (e.g., user can only modify their own profile)
	// should be handled within the accountHandler methods or service layer.
<<<<<<< HEAD
	accountGroup.Post("/change-username", authZMiddleware.VerifyInternalToken(), accountHandler.ChangeUsername)
	accountGroup.Post("/change-password", authZMiddleware.VerifyInternalToken(), accountHandler.ChangePassword)
	accountGroup.Post("/profile-picture", authZMiddleware.VerifyInternalToken(), accountHandler.UploadProfilePicture)

	// --- 2FA Setup Routes under Account ---
	twoFASetupGroup := accountGroup.Group("/2fa")
	twoFASetupGroup.Post("/generate-secret", authZMiddleware.VerifyInternalToken(), accountHandler.GenerateTwoFASetup)
	twoFASetupGroup.Post("/enable", authZMiddleware.VerifyInternalToken(), accountHandler.VerifyAndEnableTwoFA)
	twoFASetupGroup.Post("/disable", authZMiddleware.VerifyInternalToken(), accountHandler.DisableTwoFA)
=======
	accountGroup.Post("/change-username", authZMiddleware.VerifyServiceToken(), accountHandler.ChangeUsername)
	accountGroup.Post("/change-password", authZMiddleware.VerifyServiceToken(), accountHandler.ChangePassword)
	accountGroup.Post("/profile-picture", authZMiddleware.VerifyServiceToken(), accountHandler.UploadProfilePicture)

	// --- 2FA Setup Routes under Account ---
	twoFASetupGroup := accountGroup.Group("/2fa")
	twoFASetupGroup.Post("/generate-secret", authZMiddleware.VerifyServiceToken(), accountHandler.GenerateTwoFASetup)
	twoFASetupGroup.Post("/enable", authZMiddleware.VerifyServiceToken(), accountHandler.VerifyAndEnableTwoFA)
	twoFASetupGroup.Post("/disable", authZMiddleware.VerifyServiceToken(), accountHandler.DisableTwoFA)
>>>>>>> parnaz-changes

	utils.Log.Info("Profile Manager: /account and /account/2fa routes configured.")
	return nil
}
