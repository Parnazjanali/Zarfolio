package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetUpAuthRoutes(apiGroup fiber.Router, authHandler *handler.AuthHandler) error {
	if authHandler == nil {
		return fmt.Errorf("AuthHandler is nil in SetUpAuthRoutes")
	}

	authGroup := apiGroup.Group("/auth")
	utils.Log.Info("Configuring /api/v1/auth routes.")

	authGroup.Post("/register", authHandler.RegisterUser)
	authGroup.Post("/login", authHandler.LoginUser)
	authGroup.Post("/password/request-reset", authHandler.HandleRequestPasswordReset)
	authGroup.Post("/password/reset", authHandler.HandleResetPassword)
	authGroup.Post("/2fa/verify", authHandler.HandleLoginTwoFA)

	authGroup.Post("/logout", authHandler.LogoutUser)

	utils.Log.Info("Authentication routes configured.")
	return nil
}
