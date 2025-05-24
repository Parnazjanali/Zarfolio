package server

import (
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetUpApiRoutes(app *fiber.App, authHandler *handler.AuthHandler) error {
	if authHandler == nil {
		utils.Log.Fatal("AuthHandler is nil in SetupAuthRoutes, cannot set up auth routes.")
	}

	api := app.Group("/api/v1")
	utils.Log.Info("Configuring /api/v1 routes")

	registerGrouop := api.Group("/register")
	utils.Log.Info("Configuring /api/v1/register routes")
	registerGrouop.Post("/user", authHandler.RegisterUser)

	authGroup := api.Group("/auth")
	utils.Log.Info("Configuring /api/v1/auth routes")
	authGroup.Post("/login", middleware.AuthUser, authHandler.LoginUser)

	app.Use(middleware.CorsMiddleware())
	utils.Log.Info("CORS middleware applied")

	return nil

}
