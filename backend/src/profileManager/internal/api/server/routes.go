package server

import (
	"errors"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/api/middleware"                // Import middleware
	"profile-gold/internal/service"                       // Import service
	"profile-gold/internal/model"                         // For model.ErrorResponse in 404
	redisdb "profile-gold/internal/repository/db/redisDb" // Import for TokenRepository
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"go.uber.org/zap"
)

func SetupProfileManagerRoutes(
	app *fiber.App,
	authHandler *handler.AuthHandler,
	profileHandler *handler.ProfileHandler, // Can be nil if not used
	accountHandler *handler.AccountHandler,
	counterpartyHandler *handler.CounterpartyHandler, // Added CounterpartyHandler
	tokenRepo redisdb.TokenRepository, // Corrected type to redisdb.TokenRepository
	redisService *service.RedisService, // Added RedisService
) error {
	if app == nil {
		utils.Log.Fatal("Fiber app is nil in SetupProfileManagerRoutes.")
		return errors.New("fiber app cannot be nil")
	}
	if authHandler == nil {
		utils.Log.Fatal("AuthHandler is nil in SetupProfileManagerRoutes.")
		return errors.New("authHandler cannot be nil")
	}
	if accountHandler == nil {
		utils.Log.Fatal("AccountHandler is nil in SetupProfileManagerRoutes.")
		return errors.New("accountHandler cannot be nil")
	}
	if counterpartyHandler == nil { // Added check for CounterpartyHandler
		utils.Log.Fatal("CounterpartyHandler is nil in SetupProfileManagerRoutes.")
		return errors.New("counterpartyHandler cannot be nil")
	}

	utils.Log.Info("Configuring Profile Manager service routes...")

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:8080,http://localhost:3000", // Allow both apiGateway and typical frontend dev port
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))
	utils.Log.Info("Profile Manager: Global CORS middleware applied.")

	utils.Log.Info("Profile Manager: Configuring base authentication routes.")
	app.Post("/register", authHandler.Register)
	app.Post("/login", authHandler.Login)                // Step 1 login
	app.Post("/login/2fa", authHandler.HandleLoginTwoFA) // Step 2 2FA login
	app.Post("/logout", authHandler.Logout)

	passwordGroup := app.Group("/password")
	utils.Log.Info("Configuring /password routes for Profile Manager...")
	passwordGroup.Post("/request-reset", authHandler.HandleRequestPasswordReset)
	passwordGroup.Post("/reset", authHandler.HandleResetPassword)

	// Account Management Routes (Protected)
	// These routes require a valid token from apiGateway (or a direct authenticated call)

	// Create instance of our new AuthMiddleware
	authMw := middleware.NewAuthMiddleware(redisService, utils.Log) // Assuming utils.Log is a compatible logger

	// Apply the new authentication middleware
	accountGroup := app.Group("/account", authMw.Authenticate()) // Use the new middleware
	utils.Log.Info("Configuring protected /account routes for Profile Manager...")
	accountGroup.Post("/change-username", accountHandler.HandleChangeUsername)
	accountGroup.Post("/change-password", accountHandler.HandleChangePassword)

	twoFAGroup := accountGroup.Group("/2fa") // Sub-group for 2FA under /account
	utils.Log.Info("Configuring protected /account/2fa routes for Profile Manager...")
	twoFAGroup.Post("/generate-secret", accountHandler.HandleGenerateTwoFASetup)
	twoFAGroup.Post("/enable", accountHandler.HandleVerifyAndEnableTwoFA)
	twoFAGroup.Post("/disable", accountHandler.HandleDisableTwoFA)

	// Counterparty Routes (Protected)
	counterpartyGroup := app.Group("/counterparties", authMw.Authenticate())
	utils.Log.Info("Configuring protected /counterparties routes for Profile Manager...")
	counterpartyGroup.Post("/", counterpartyHandler.CreateCounterparty)
	counterpartyGroup.Get("/:id", counterpartyHandler.GetCounterparty)
	counterpartyGroup.Get("/", counterpartyHandler.ListCounterparties)
	counterpartyGroup.Put("/:id", counterpartyHandler.UpdateCounterparty)
	counterpartyGroup.Delete("/:id", counterpartyHandler.DeleteCounterparty)

	if profileHandler != nil {
		utils.Log.Info("ProfileHandler is available. Configuring /profiles routes.")
		// Example: Make profile routes also protected if they modify data
		// profileProtectedGroup := app.Group("/profiles", middleware.PlaceholderAuthMiddleware())
		// profileProtectedGroup.Post("/", profileHandler.CreateProfile)
		// profileProtectedGroup.Put("/:id", profileHandler.UpdateProfile)
		// profileProtectedGroup.Delete("/:id", profileHandler.DeleteProfile)

		// Public profile GET route might be separate
		// app.Get("/profiles/:id", profileHandler.GetProfile)

		// For simplicity, keeping as is from before, but auth should be considered for POST/PUT/DELETE
		profileGroup := app.Group("/profiles")
		profileGroup.Post("/", profileHandler.CreateProfile)
		profileGroup.Get("/:id", profileHandler.GetProfile)
		profileGroup.Put("/:id", profileHandler.UpdateProfile)
		profileGroup.Delete("/:id", profileHandler.DeleteProfile)
	} else {
		utils.Log.Warn("ProfileHandler is nil. Profile management routes will not be configured.")
	}

	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("Profile Manager: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "Profile Manager: The requested resource was not found."})
	})
	utils.Log.Info("Profile Manager: 404 fallback route configured.")

	utils.Log.Info("Profile Manager service routes configured successfully.")
	return nil
}
