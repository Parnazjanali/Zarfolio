package router 

import (
	"fmt"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/api/middleware"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetUpUserManagementRoutes(app *fiber.App, userHandler *handler.UserHandler, authZMiddleware *middleware.AuthZMiddleware) error {
	if app == nil {
		return fmt.Errorf("Fiber app instance is nil in Profile Manager's SetUpUserManagementRoutes")
	}
	if userHandler == nil {
		return fmt.Errorf("UserHandler is nil in Profile Manager's SetUpUserManagementRoutes")
	}
	if authZMiddleware == nil {
		return fmt.Errorf("AuthZMiddleware is nil in Profile Manager's SetUpUserManagementRoutes")
	}

	//userGroup := app.Group("/users")
	utils.Log.Info("Profile Manager: Configuring /users routes (for admin management).")

	/*userGroup.Get("/", authZMiddleware.VerifyInternalToken(), authZMiddleware.AuthorizePermission(model.PermUserRead), userHandler.GetUsers)
	userGroup.Get("/:id", authZMiddleware.VerifyInternalToken(), authZMiddleware.AuthorizePermission(model.PermUserRead), userHandler.GetUserByID)
	userGroup.Post("/", authZMiddleware.VerifyInternalToken(), authZMiddleware.AuthorizePermission(model.PermUserCreate), userHandler.CreateUser)
	userGroup.Put("/:id", authZMiddleware.VerifyInternalToken(), authZMiddleware.AuthorizePermission(model.PermUserUpdate), userHandler.UpdateUser)
	userGroup.Delete("/:id", authZMiddleware.VerifyInternalToken(), authZMiddleware.AuthorizePermission(model.PermUserDelete), userHandler.DeleteUser)
	userGroup.Put("/:user_id/roles", authZMiddleware.VerifyInternalToken(), authZMiddleware.AuthorizePermission(model.PermUserUpdate), userHandler.HandleUpdateUserRoles)
	utils.Log.Info("Profile Manager: /users routes configured.")*/

	return nil
}
