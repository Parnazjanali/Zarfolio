package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/api/proxy"
	"gold-api/internal/authz"
	"gold-api/internal/service/auth"
	profilemanager "gold-api/internal/service/profilemanger"
	"gold-api/internal/utils"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func StartServer(port string) {
	utils.Log.Info("Starting Fiber Api Gateway server...")

	app := fiber.New()
	utils.Log.Info("Fiber app instance created.")

	// Apply global middlewares
	app.Use(middleware.CorsMiddleware())
	utils.Log.Info("CORS middleware applied.")

	// ProfileManagerClient
	profileManagerBaseURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerBaseURL == "" {
		utils.Log.Fatal("PROFILE_MANAGER_BASE_URL environment variable is not set. Exiting application.")
	}

	utils.Log.Info("Initializing ProfileManagerClient", zap.String("url", profileManagerBaseURL))

	profileManagerClient, err := profilemanager.NewClient(profileManagerBaseURL) // 👈 اینجا خطا رو می‌گیری
	if err != nil {                                                              // 👈 و اینجا چک می‌کنی. اگه خطا باشه، برنامه اینجا متوقف می‌شه.
		utils.Log.Fatal("Failed to initialize ProfileManagerClient.", zap.Error(err))
	}
	//  PermissionService (for RBAC middleware)
	permissionService := authz.NewPermissionService(utils.Log)
	if permissionService == nil {
		utils.Log.Fatal("ERROR: Failed to initialize PermissionService. Exiting application.")
	}
	utils.Log.Info("PermissionService initialized successfully.")

	// AuthService
	// ایجاد AuthService
	authSvc, err := auth.NewAuthService(profileManagerClient) // 👈 اینجا: هم authSvc و هم err رو بگیر
	if err != nil {                                           // 👈 اینجا: خطا رو بررسی کن و اگر nil نبود، برنامه رو متوقف کن
		utils.Log.Fatal("Failed to initialize AuthService. Exiting application.", zap.Error(err))
	}
	// این خط دیگه نباید لازم باشه چون بالا Log.Fatal رو گذاشتیم.
	// utils.Log.Info("AuthService initialized successfully.")

	// ایجاد AuthHandler
	// اگر NewAuthHandler هم خطا برمی‌گرداند، آن را هم چک کنید.
	authHandler, err := handler.NewAuthHandler(authSvc) // 👈 هر دو مقدار رو دریافت کن
	if err != nil {                                     // 👈 خطا رو بررسی کن
		utils.Log.Fatal("Failed to initialize AuthHandler. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("AuthHandler initialized successfully.")

	accountHandlerAG := handler.NewAccountHandlerAG(profileManagerClient)
	if accountHandlerAG == nil {
		utils.Log.Fatal("ERROR: Failed to initialize AccountHandlerAG. Exiting application.")
	}
	utils.Log.Info("AccountHandlerAG initialized successfully.")

	profileHandlerAG := handler.NewProfileHandler(profileManagerClient)
	if profileHandlerAG == nil {
		utils.Log.Fatal("ERROR: Failed to initialize ProfileHandler for API Gateway. Exiting application.")
	}
	utils.Log.Info("ProfileHandlerAG initialized successfully.")

	proxyHandler := proxy.NewProxyHandler(utils.Log)
	utils.Log.Info("ProxyHandler initialized successfully.")

	utils.Log.Info("All core dependencies initialized successfully.")
	utils.Log.Info("Setting up API routes for API Gateway...")

	if err := SetupAllRoutes( // Call SetupAllRoutes with the initialized handlers
		app,
		authHandler,
		accountHandlerAG,
		permissionService,
		profileHandlerAG,
		proxyHandler,
	); err != nil {
		utils.Log.Fatal("ERROR: Failed to set up API routes: %v. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("All API routes configured successfully.")

	// Start listening for requests
	fullAddr := fmt.Sprintf("0.0.0.0%s", port)
	utils.Log.Info("API Gateway is attempting to listen", zap.String("address", fullAddr))
	log.Fatal(app.Listen(port))
}
