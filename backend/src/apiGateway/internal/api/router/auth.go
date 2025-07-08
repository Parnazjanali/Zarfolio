package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware" 
	"gold-api/internal/model"         
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
)


func SetUpAuthRoutes(apiGroup fiber.Router, authHandler *handler.AuthHandler, authMiddleware *middleware.AuthMiddleware) error { 
	if authHandler == nil {
		return fmt.Errorf("AuthHandler is nil in SetUpAuthRoutes")
	}
	if authMiddleware == nil { 
		return fmt.Errorf("AuthMiddleware is nil in SetUpAuthRoutes")
	}

	authGroup := apiGroup.Group("/auth") 
	utils.Log.Info("Configuring /api/v1/auth routes.")

	authGroup.Post("/register", authHandler.RegisterUser)
	authGroup.Post("/login", authHandler.LoginUser)
	authGroup.Post("/password/request-reset", authHandler.HandleRequestPasswordReset)
	authGroup.Post("/password/reset", authHandler.HandleResetPassword)
	authGroup.Post("/2fa/verify", authHandler.HandleLoginTwoFA) // For second step of 2FA login

	
	authGroup.Post("/logout", authMiddleware.AuthorizeMiddleware(model.PermUserRead), authHandler.LogoutUser)

	utils.Log.Info("Authentication routes configured.")
	return nil
}