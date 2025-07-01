package server

import (
	"gold-api/internal/api/handler"
	"gold-api/internal/service"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpUserRoutes(app *fiber.App, profileHandlerAG *handler.ProfileHandlerAG, permissionService *service.PermissionService, logger *zap.Logger) error {

	/*if profileHandlerAG == nil {
		return fmt.Errorf("profileHandlerAG is nil in SetUpUserRoutes")
	}
	if permissionService == nil {
		return fmt.Errorf("PermissionService is nil in SetUpAccountRoutes")
	}

	api := app.Group("/api/v1")
	authMiddleware := middleware.NewAuthMiddleware(permissionService, logger)

	userManagementGroup := api.Group("/users")
	utils.Log.Info("Configuring /api/v1/users protected routes for user management.")
	userManagementGroup.Get("/", authMiddleware.AuthorizeMiddleware(model.PermUserRead), profileHandlerAG.GetUsers)
	userManagementGroup.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserRead), profileHandlerAG.GetUserByID)
	userManagementGroup.Post("/", authMiddleware.AuthorizeMiddleware(model.PermUserCreate), profileHandlerAG.CreateUser)
	userManagementGroup.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), profileHandlerAG.UpdateUser)
	userManagementGroup.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserDelete), profileHandlerAG.DeleteUser)
	userManagementGroup.Put("/:user_id/roles", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), profileHandlerAG.HandleUpdateUserRoles)


	utils.Log.Info("/users routes configured with RBAC.")
	return nil*/
	return  nil
}
