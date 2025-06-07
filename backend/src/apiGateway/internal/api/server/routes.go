package server

import (
	"fmt" // For proxy
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/utils"
	"net/http" // For proxy
	"os"       // For proxy (Getenv)
	"time"     // For proxy (http.Client timeout)

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// Add accountHandlerAG *handler.AccountHandlerAG to signature
func SetUpApiRoutes(app *fiber.App, authHandler *handler.AuthHandler, accountHandlerAG *handler.AccountHandlerAG) error {
	if authHandler == nil {
		utils.Log.Fatal("AuthHandler is nil in SetUpApiRoutes.")
		// return errors.New("authHandler cannot be nil")
	}
	if accountHandlerAG == nil { // Add check
		utils.Log.Fatal("AccountHandlerAG is nil in SetUpApiRoutes.")
		// return errors.New("accountHandlerAG cannot be nil")
	}

	api := app.Group("/api/v1")
	utils.Log.Info("Configuring /api/v1 routes")

	registerGroup := api.Group("/register")
	utils.Log.Info("Configuring /api/v1/register routes")
	registerGroup.Post("/user", authHandler.RegisterUser)

	authGroup := api.Group("/auth")
	utils.Log.Info("Configuring /api/v1/auth routes")
	authGroup.Post("/login", authHandler.LoginUser) // Removed AuthUser middleware
	authGroup.Post("/logout", middleware.AuthUser, authHandler.LogoutUser)

	// Add new password reset routes to the existing authGroup
	authGroup.Post("/password/request-reset", authHandler.HandleRequestPasswordReset)
	authGroup.Post("/password/reset", authHandler.HandleResetPassword)

	// <<< تغییر در این خط >>>
	// آدرس برای تطابق با فرانت‌اند اصلاح شد
	authGroup.Post("/2fa/verify", authHandler.HandleLoginTwoFA)
	utils.Log.Info("Configuring /api/v1/auth/password and /api/v1/auth/2fa/verify routes")

	accountGroup := api.Group("/account", middleware.AuthUser) // Protected by existing AuthUser middleware
	utils.Log.Info("Configuring /api/v1/account routes")
	accountGroup.Post("/change-username", accountHandlerAG.HandleChangeUsername)
	accountGroup.Post("/change-password", accountHandlerAG.HandleChangePassword)
	accountGroup.Post("/profile-picture", accountHandlerAG.HandleProfilePictureUpload) // New route for upload
	utils.Log.Info("Configuring /api/v1/account/profile-picture route")

	// Add 2FA setup routes to the protected accountGroup
	if accountHandlerAG != nil { // Ensure accountHandlerAG is not nil before using
		twoFASetupGroup := accountGroup.Group("/2fa")
		utils.Log.Info("Configuring /api/v1/account/2fa routes for 2FA setup")
		twoFASetupGroup.Post("/generate-secret", accountHandlerAG.HandleGenerateTwoFASetup)
		twoFASetupGroup.Post("/enable", accountHandlerAG.HandleVerifyAndEnableTwoFA)
		twoFASetupGroup.Post("/disable", accountHandlerAG.HandleDisableTwoFA)
	} else {
		utils.Log.Warn("AccountHandlerAG is nil, skipping 2FA setup routes in API Gateway.")
	}

	// Simplified GET Proxy for /api/v1/uploads/* to profileManager
	profileManagerServiceURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerServiceURL != "" {
		api.Get("/uploads/*", func(c *fiber.Ctx) error {
			targetPath := c.Params("*")
			targetURL := fmt.Sprintf("%s/uploads/%s", profileManagerServiceURL, targetPath)

			utils.Log.Info("Attempting to proxy GET request for static file", zap.String("original_path", c.Path()), zap.String("target_url", targetURL))

			proxyReq, err := http.NewRequest(http.MethodGet, targetURL, nil)
			if err != nil {
				utils.Log.Error("Failed to create proxy request", zap.Error(err))
				return c.Status(fiber.StatusInternalServerError).SendString("Proxy error: Could not create request.")
			}

			client := http.Client{Timeout: 10 * time.Second}
			resp, err := client.Do(proxyReq)
			if err != nil {
				utils.Log.Error("Failed to execute proxy request", zap.Error(err), zap.String("target_url", targetURL))
				return c.Status(fiber.StatusBadGateway).SendString("Proxy error: Could not reach backend service.")
			}
			defer resp.Body.Close()

			c.Status(resp.StatusCode)
			for key, values := range resp.Header {
				for _, value := range values {
					if key == "Content-Type" || key == "Content-Length" || key == "ETag" || key == "Last-Modified" || key == "Cache-Control" {
						c.Set(key, value)
					}
				}
			}
			return c.SendStream(resp.Body)
		})
		utils.Log.Info("Configured basic GET proxy for /api/v1/uploads/* to profileManager", zap.String("profile_manager_url", profileManagerServiceURL))
	} else {
		utils.Log.Warn("PROFILE_MANAGER_BASE_URL not set in env. Cannot configure proxy for profile pictures.")
	}

	app.Use(func(c *fiber.Ctx) error {
		utils.Log.Warn("API Gateway: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "API Gateway: The requested resource was not found."})
	})
	utils.Log.Info("API Gateway: 404 fallback route configured.")

	return nil
}