package server

import (
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// Add accountHandlerAG *handler.AccountHandlerAG to signature
func SetUpApiRoutes(app *fiber.App, authHandler *handler.AuthHandler, accountHandlerAG *handler.AccountHandlerAG) error {
	if authHandler == nil {
		utils.Log.Fatal("AuthHandler is nil in SetUpApiRoutes.")
		// return errors.New("authHandler cannot be nil")
	}
	if accountHandlerAG == nil { // Add check
		utils.Log.Fatal("AccountHandlerAG is nil in SetUpApiRoutes.")
		// return errors.New("accountHandlerAG cannot be nil")
	}

	api := app.Group("/api/v1")
	utils.Log.Info("Configuring /api/v1 routes")

	registerGroup := api.Group("/register")
	utils.Log.Info("Configuring /api/v1/register routes")
	registerGroup.Post("/user", authHandler.RegisterUser)

	authGroup := api.Group("/auth")
	utils.Log.Info("Configuring /api/v1/auth routes")
	authGroup.Post("/login", middleware.AuthUser, authHandler.LoginUser)
	authGroup.Post("/logout", middleware.AuthUser, authHandler.LogoutUser)

	// Add new password reset routes to the existing authGroup
	authGroup.Post("/password/request-reset", authHandler.HandleRequestPasswordReset)
	authGroup.Post("/password/reset", authHandler.HandleResetPassword)
	utils.Log.Info("Configuring /api/v1/auth/password routes for password reset")

	accountGroup := api.Group("/account", middleware.AuthUser) // Protected by existing AuthUser middleware
	utils.Log.Info("Configuring /api/v1/account routes")
	accountGroup.Post("/change-username", accountHandlerAG.HandleChangeUsername)
	accountGroup.Post("/change-password", accountHandlerAG.HandleChangePassword)

	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("API Gateway: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "API Gateway: The requested resource was not found."})
	})
	utils.Log.Info("API Gateway: 404 fallback route configured.")

	return nil

}
