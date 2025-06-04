package server

import (
	"errors" // Added import for errors
	"profile-gold/internal/api/handler"
	// "profile-gold/internal/api/middleware" // Add if Profile Manager needs its own middleware
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors" // Added import for CORS
	"go.uber.org/zap"
)

// SetupProfileManagerRoutes configures the routes for the Profile Manager service.
func SetupProfileManagerRoutes(app *fiber.App, authHandler *handler.AuthHandler, profileHandler *handler.ProfileHandler) error {
	if app == nil {
		utils.Log.Fatal("Fiber app is nil in SetupProfileManagerRoutes.")
		// Return an error as per original plan, though Fatal will exit.
		return errors.New("fiber app cannot be nil")
	}
	if authHandler == nil {
		utils.Log.Fatal("AuthHandler is nil in SetupProfileManagerRoutes.")
		return errors.New("authHandler cannot be nil")
	}
	// profileHandler check from plan:
	// if profileHandler == nil { // If profileHandler is strictly required for any routes it handles.
	//     utils.Log.Fatal("ProfileHandler is nil in SetupProfileManagerRoutes.")
	//     return errors.New("profileHandler cannot be nil")
	// }

	utils.Log.Info("Configuring Profile Manager service routes...")

	// Apply CORS configuration from existing file
	app.Use(cors.New(cors.Config{
		AllowOrigins:   "http://localhost:8080", // This might need to be more flexible, e.g., from config
		AllowMethods:   "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:   "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))
	utils.Log.Info("Profile Manager: Global CORS middleware applied.")


	// Authentication routes
	// These are the internal endpoints that apiGateway calls.
	// No /api/v1 prefix here as apiGateway handles that.
	utils.Log.Info("Profile Manager: Configuring base authentication routes.")
	app.Post("/register", authHandler.Register)
	app.Post("/login", authHandler.Login)
	app.Post("/logout", authHandler.Logout) // Assuming Logout is a method in AuthHandler

	// New Password Reset Routes for Profile Manager
	passwordGroup := app.Group("/password") // Grouping for password related routes
	utils.Log.Info("Configuring /password routes for Profile Manager...")

	passwordGroup.Post("/request-reset", authHandler.HandleRequestPasswordReset)
	passwordGroup.Post("/reset", authHandler.HandleResetPassword)


	// Placeholder for other profile routes if ProfileHandler is used
	if profileHandler != nil {
		utils.Log.Info("ProfileHandler is available. Configuring /profiles routes.")
		profileGroup := app.Group("/profiles")
		profileGroup.Post("/", profileHandler.CreateProfile)
		profileGroup.Get("/:id", profileHandler.GetProfile)
		profileGroup.Put("/:id", profileHandler.UpdateProfile)
		profileGroup.Delete("/:id", profileHandler.DeleteProfile)
	} else {
        utils.Log.Warn("ProfileHandler is nil. Profile management routes will not be configured.")
    }

	// Fallback for 404 within profileManager if no routes match
	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("Profile Manager: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Profile Manager: The requested resource was not found."})
	})
	utils.Log.Info("Profile Manager: 404 fallback route configured.")

	utils.Log.Info("Profile Manager service routes configured successfully.")
	return nil
}
