package server

import (
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpApiRoutes(app *fiber.App, authHandler *handler.AuthHandler) error {
	if authHandler == nil {
		utils.Log.Fatal("AuthHandler is nil in SetupAuthRoutes, cannot set up auth routes.")
	}

	api := app.Group("/api/v1")
	utils.Log.Info("Configuring /api/v1 routes")

	registerGroup := api.Group("/register")
	utils.Log.Info("Configuring /api/v1/register routes")
	registerGroup.Post("/user", authHandler.RegisterUser)

	authGroup := api.Group("/auth")
	utils.Log.Info("Configuring /api/v1/auth routes")
	authGroup.Post("/login", middleware.AuthUser, authHandler.LoginUser)

	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("API Gateway: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "API Gateway: The requested resource was not found."})
	})
	utils.Log.Info("API Gateway: 404 fallback route configured.")

	return nil

}
