package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap" 
)

func SetUpUserManagementRoutes(
	apiGroup fiber.Router,
	profileHandlerAG *handler.ProfileHandler,
	authMiddleware *middleware.AuthMiddleware,
	logger *zap.Logger, 
) error {
	defer logger.Sync() 

	if profileHandlerAG == nil {
		logger.Error("ProfileHandlerAG is nil",
			zap.String("service", "api-gateway"),
			zap.String("route_group", "users"))
		return fmt.Errorf("ProfileHandlerAG is nil in SetUpUserManagementRoutes")
	}
	if authMiddleware == nil {
		logger.Error("AuthMiddleware is nil",
			zap.String("service", "api-gateway"),
			zap.String("route_group", "users"))
		return fmt.Errorf("AuthMiddleware is nil in SetUpUserManagementRoutes")
	}

	userManagementGroup := apiGroup.Group("/users")
	logger.Debug("Configuring /api/v1/users protected routes for user management",
		zap.String("service", "api-gateway"),
		zap.String("route_group", "users"))

	userManagementGroup.Get("/", authMiddleware.AuthorizeMiddleware(model.PermUserRead), profileHandlerAG.GetUsers)
	userManagementGroup.Get("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserRead), profileHandlerAG.GetUserByID)
	userManagementGroup.Post("/", authMiddleware.AuthorizeMiddleware(model.PermUserCreate), profileHandlerAG.CreateUser)
	userManagementGroup.Put("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), profileHandlerAG.UpdateUser)
	userManagementGroup.Delete("/:id", authMiddleware.AuthorizeMiddleware(model.PermUserDelete), profileHandlerAG.DeleteUser)
	userManagementGroup.Put("/:user_id/roles", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), profileHandlerAG.HandleUpdateUserRoles)

	logger.Debug("User management routes configured with RBAC",
		zap.String("service", "api-gateway"),
		zap.String("route_group", "users"))

	return nil
}