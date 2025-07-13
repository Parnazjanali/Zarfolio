package router

import (
    "fmt"
    "profile-gold/internal/api/handler"
    "profile-gold/internal/api/middleware" 
    "profile-gold/internal/utils"

    "github.com/gofiber/fiber/v2"
)

func SetuUpAuthRoutes(app *fiber.App, authHandler *handler.AuthHandler, authZMiddleware *middleware.AuthZMiddleware) error { 
    if app == nil {
        return fmt.Errorf("Fiber app instance is nil in Profile Manager's SetUpAuthRoutes")
    }
    if authHandler == nil {
        return fmt.Errorf("AuthHandler is nil in Profile Manager's SetUpAuthRoutes")
    }
    if authZMiddleware == nil { 
        return fmt.Errorf("AuthZMiddleware is nil in Profile Manager's SetUpAuthRoutes")
    }

    authGroup := app.Group("/auth")
    utils.Log.Info("Profile Manager: Configuring /auth routes.")

    authGroup.Post("/register", authHandler.Register)
    authGroup.Post("/login", authHandler.Login)
    authGroup.Post("/password/request-reset", authHandler.RequestPasswordReset)
    authGroup.Post("/password/reset", authHandler.ResetPassword)
    authGroup.Post("/2fa/verify", authHandler.VerifyTwoFA)


    authGroup.Post("/logout", authZMiddleware.VerifyInternalToken(), authHandler.Logout) 

    utils.Log.Info("Profile Manager: Authentication routes configured.")

    return nil
}