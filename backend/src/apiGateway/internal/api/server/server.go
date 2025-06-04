package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/service"
	"gold-api/internal/utils"
	"log"
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

	// ساخت هندلر احراز هویت (AuthHandler) و دادن AuthService به آن.
	authHandler := handler.NewAuthHandler(authService)
	if authHandler == nil {
		utils.Log.Fatal("ERROR: Failed to initialize AuthHandler. Exiting application.")
	}

	accountHandlerAG := handler.NewAccountHandlerAG(authService) // Use the new AccountHandlerAG
	if accountHandlerAG == nil {
		utils.Log.Fatal("ERROR: Failed to initialize AccountHandlerAG. Exiting application.")
	}
	utils.Log.Info("All core dependencies initialized successfully.")

	// 4. تنظیم تمامی مسیرهای API
	// ما app و هندلرهای آماده شده را به تابع SetupApiRoutes می‌دهیم تا روت‌ها را ثبت کند.
	utils.Log.Info("Setting up API routes for API Gateway...")
	if err := SetUpApiRoutes(app, authHandler, accountHandlerAG); err != nil { // Pass accountHandlerAG
		utils.Log.Fatal("ERROR: Failed to set up API routes: %v. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("All API routes configured successfully.")

	// 5. شروع گوش دادن سرور به درخواست‌ها
	utils.Log.Info("API Gateway is attempting to listen", zap.String("address", fmt.Sprintf("0.0.0.0%s", port)))
	// log.Fatal برنامه را در صورت خطای شروع سرور (مثلاً پورت اشغال شده) متوقف می‌کند.
	log.Fatal(app.Listen(port))
}
