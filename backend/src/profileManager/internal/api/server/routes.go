package server

import (
	"fmt"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"go.uber.org/zap"
)

func SetupProfileManagerRoutes(app *fiber.App, authHandler *handler.AuthHandler, profileHandler *handler.ProfileHandler) error {
	if app == nil {
		return fmt.Errorf("fiber app instance is nil in SetupProfileManagerRoutes")
	}
	if authHandler == nil {
		utils.Log.Fatal("AuthHandler is nil in SetupProfileManagerRoutes, cannot set up auth routes.")
	}
	
	app.Use(cors.New(cors.Config{
		AllowOrigins:   "http://localhost:8080", 
		AllowMethods:   "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:   "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))
	utils.Log.Info("Profile Manager: Global CORS middleware applied.")

	
	authGroup := app.Group("/") 
	utils.Log.Info("Profile Manager: Configuring authentication routes.")
	authGroup.Post("/register", authHandler.Register) 
	authGroup.Post("/login", authHandler.Login)      
	utils.Log.Info("Profile Manager: Authentication routes configured.")

	profileGroup := app.Group("/profiles")
	utils.Log.Info("Profile Manager: Configuring /profiles routes.")
	 profileGroup.Post("/", profileHandler.CreateProfile)      
	 profileGroup.Get("/:id", profileHandler.GetProfile)       
	 profileGroup.Put("/:id", profileHandler.UpdateProfile)    
	 profileGroup.Delete("/:id", profileHandler.DeleteProfile) 
	utils.Log.Info("Profile Manager: Profile management routes configured.")


	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("Profile Manager: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Profile Manager: The requested resource was not found."})
	})
	utils.Log.Info("Profile Manager: 404 fallback route configured.")

	return nil 
}
