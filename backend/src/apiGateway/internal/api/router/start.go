package server

import (
	"fmt"
	"gold-api/internal/api/authz"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/api/proxy"
	"gold-api/internal/service/auth"
	"gold-api/internal/service/crm"
	crmmanager "gold-api/internal/service/crmManager"
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

	app.Use(middleware.CorsMiddleware())
	utils.Log.Info("CORS middleware applied.")

	profileManagerBaseURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerBaseURL == "" {
		utils.Log.Fatal("PROFILE_MANAGER_BASE_URL environment variable is not set. Exiting application.")
	}
	crmManagerBaseURL := os.Getenv("CRM_MANAGER_BASE_URL")
	if crmManagerBaseURL == "" {
		utils.Log.Fatal("CRM_MANAGER_BASE_URL environment variable is not set. Exiting application.")
	}
	utils.Log.Info("ProfileManagerBaseURL from env", zap.String("url", profileManagerBaseURL))
	utils.Log.Info("CRMManagerBaseURL from env", zap.String("url", crmManagerBaseURL))

	utils.Log.Info("Initializing ProfileManagerClient", zap.String("url", profileManagerBaseURL))

	profileManagerClient, err := profilemanager.NewClient(profileManagerBaseURL)
	if err != nil {
		utils.Log.Fatal("Failed to initialize ProfileManagerClient.", zap.Error(err))
	}

	permissionService := authz.NewPermissionService(utils.Log)
	if permissionService == nil {
		utils.Log.Fatal("ERROR: Failed to initialize PermissionService. Exiting application.")
	}
	utils.Log.Info("PermissionService initialized successfully.")

	authSvc, err := auth.NewAuthService(profileManagerClient)
	if err != nil {
		utils.Log.Fatal("Failed to initialize AuthService. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("AuthService initialized successfully.")

	authHandler, err := handler.NewAuthHandler(authSvc)
	if err != nil {
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

	crmManagerClient, err := crmmanager.NewCrmManagerClient(crmManagerBaseURL)
	if err != nil {
		utils.Log.Fatal("Failed to initialize CrmManagerClient. Exiting application.", zap.Error(err))
	}

	crmSvc, err := crm.NewCrmService(crmManagerClient)
	if err != nil {
		utils.Log.Fatal("Failed to initialize CrmService. Exiting application.", zap.Error(err))
	}
	crmHandlerAG := handler.NewCrmHandler(crmSvc, utils.Log)
	utils.Log.Info("CrmHandlerAG initialized successfully.")

	proxyHandler := proxy.NewProxyHandler(utils.Log)
	utils.Log.Info("ProxyHandler initialized successfully.")

	utils.Log.Info("All core dependencies initialized successfully.")
	utils.Log.Info("Setting up API routes for API Gateway...")

	if err := SetupAllRoutes(
		app,
		authHandler,
		accountHandlerAG,
		crmHandlerAG,
		permissionService,
		profileHandlerAG,
		proxyHandler,
	); err != nil {
		utils.Log.Fatal("ERROR: Failed to set up API routes: %v. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("All API routes configured successfully.")

	fullAddr := fmt.Sprintf("0.0.0.0%s", port)
	utils.Log.Info("API Gateway is attempting to listen", zap.String("address", fullAddr))
	log.Fatal(app.Listen(port))
}
