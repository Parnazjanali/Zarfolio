package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetUpUserManagementRoutes(apiGroup fiber.Router, profileHandlerAG *handler.ProfileHandler, authMiddleware *middleware.AuthMiddleware) error {
	if profileHandlerAG == nil {
		return fmt.Errorf("ProfileHandlerAG is nil in SetUpUserManagementRoutes")
	}
	if authMiddleware == nil {
		return fmt.Errorf("AuthMiddleware is nil in SetUpUserManagementRoutes")
	}

	userManagementGroup := apiGroup.Group("/users")
	utils.Log.Info("Configuring /api/v1/users protected routes for user management.")

	userManagementGroup.Get("/", authMiddleware.AuthorizeMiddleware(model.PermUserRead), profileHandlerAG.GetUsers)
	userManagementGroup.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserRead), profileHandlerAG.GetUserByID)
	userManagementGroup.Post("/", authMiddleware.AuthorizeMiddleware(model.PermUserCreate), profileHandlerAG.CreateUser)
	userManagementGroup.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), profileHandlerAG.UpdateUser)
	userManagementGroup.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserDelete), profileHandlerAG.DeleteUser)
	userManagementGroup.Put("/:user_id/roles", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), profileHandlerAG.HandleUpdateUserRoles)

	utils.Log.Info("/users routes configured with RBAC.")
	return nil
}
