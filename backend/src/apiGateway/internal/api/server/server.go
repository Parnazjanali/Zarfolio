package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/service"
	"gold-api/internal/utils"
	"os"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func StartServer(port string) {

	utils.Log.Info("Starting Fiber Api Gateway server")

	app := fiber.New()
	utils.Log.Info("Fiber app instance created")

	app.Use(middleware.CorsMiddleware())
	utils.Log.Info("CORS middleware applied")

	profileManagerBaseURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerBaseURL == "" {
		utils.Log.Fatal("PROFILE_MANAGER_BASE_URL environment variable is not set. Exiting application.")
	}
	utils.Log.Info("Initializing ProfileManagerClient", zap.String("url", profileManagerBaseURL))
	profileManagerClient := service.NewProfileManagerClient(profileManagerBaseURL)
	if profileManagerClient == nil {
		utils.Log.Fatal("Failed to initialize ProfileManagerClient. Exiting application.")
	}
	utils.Log.Info("ProfileManagerClient initialized successfully.")

	authService := service.NewAuthService(profileManagerClient)
	if authService == nil {
		utils.Log.Fatal("ERROR: Failed to initialize AuthService. Exiting application.")
	}

	// Create AuthHandler and provide AuthService to it.
	authHandler := handler.NewAuthHandler(authService)
	if authHandler == nil {
		utils.Log.Fatal("ERROR: Failed to initialize AuthHandler. Exiting application.")
	}

	accountHandlerAG := handler.NewAccountHandlerAG(authService) // Use the new AccountHandlerAG
	if accountHandlerAG == nil {
		utils.Log.Fatal("ERROR: Failed to initialize AccountHandlerAG. Exiting application.")
	}
	utils.Log.Info("All core dependencies initialized successfully.")

	// 4. Setting up all API routes
	// We provide the app and prepared handlers to the SetupApiRoutes function to register the routes.
	utils.Log.Info("Setting up API routes for API Gateway...")
	// +++ START OF CHANGE +++
	// Pass the profileManagerClient dependency down to the route setup function.
	if err := SetUpApiRoutes(app, authHandler, accountHandlerAG, profileManagerClient); err != nil { // Pass profileManagerClient
	// +++ END OF CHANGE +++
		utils.Log.Fatal("ERROR: Failed to set up API routes: %v. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("All API routes configured successfully.")

	// 5. Start server listening for requests
	utils.Log.Info("API Gateway is attempting to listen", zap.String("address", fmt.Sprintf("0.0.0.0%s", port)))
	// Use utils.Log for fatal errors to ensure consistent logging
	if err := app.Listen(port); err != nil {
		utils.Log.Fatal("API Gateway server failed to start", zap.Error(err))
	}
}
