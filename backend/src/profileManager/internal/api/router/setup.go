// File: profilemanager/internal/api/router/start.go (نام آن را به cmd/main.go تغییر دهید)
package router // اگر در cmd/main.go باشد، package main خواهد بود

import (
    "fmt"
    "log"
    "profile-gold/internal/api/authz" // <-- برای PermissionService
    "profile-gold/internal/api/handler"
    "profile-gold/internal/api/middleware" // <-- برای NewAuthZMiddleware
    "profile-gold/internal/repository/db/postgresDb"
    redisdb "profile-gold/internal/repository/db/redisDb"
    "profile-gold/internal/service/account" // <-- برای AccountService
    authService "profile-gold/internal/service/auth" // <-- برای AuthService
    "profile-gold/internal/service/user" // <-- برای UserService
    "profile-gold/internal/utils" // <-- برای JWTValidator
    "github.com/gofiber/fiber/v2"
    "go.uber.org/zap"
)

// StartServer (این تابع بهتر است در cmd/main.go باشد)

// --- تابع SetupAllRoutes (در profilemanager/internal/api/router/setup.go) ---
// این تابع مسئول فراخوانی SetUpAuthRoutes، SetUpAccountRoutes، SetUpUserManagementRoutes است.
// امضای آن باید متناسب با ورودی های StartServer باشد.
func SetupAllRoutes(app *fiber.App, authHandler *handler.AuthHandler, accountHandler *handler.AccountHandler, userHandler *handler.UserHandler, authZMiddleware *middleware.AuthZMiddleware) error {
    if app == nil { return fmt.Errorf("app is nil") }
    // ... چک های nil برای سایر هندلرها
    if authHandler == nil { return fmt.Errorf("authHandler is nil") }
    if accountHandler == nil { return fmt.Errorf("accountHandler is nil") }
    if userHandler == nil { return fmt.Errorf("userHandler is nil") }
    if authZMiddleware == nil { return fmt.Errorf("authZMiddleware is nil") }


    // --- Set up Auth Routes ---
    if err := SetUpAuthRoutes(app, authHandler); err != nil { // Auth routes don't need authZMiddleware
        return fmt.Errorf("failed to set up auth routes: %w", err)
    }

    // --- Set up Account Routes ---
    if err := SetUpAccountRoutes(app, accountHandler, authZMiddleware); err != nil {
        return fmt.Errorf("failed to set up account routes: %w", err)
    }

    // --- Set up User Management Routes ---
    if err := SetUpUserManagementRoutes(app, userHandler, authZMiddleware); err != nil {
        return fmt.Errorf("failed to set up user management routes: %w", err)
    }

    // ... Fallback 404 handler (if needed in Profile Manager)
    app.Use(func(c *fiber.Ctx) error {
        utils.Log.Warn("Profile Manager: 404 Not Found", zap.String("method", c.Method()), zap.String("path", c.OriginalURL()))
        return c.Status(fiber.StatusNotFound).JSON(service.ErrorResponse{Message: "Profile Manager: The requested resource was not found."}) // Assuming service.ErrorResponse
    })

    return nil
}

// --- تابع SetUpAccountRoutes (در profilemanager/internal/api/router/account.go) ---
// این همان تابعی است که شما ارائه دادید:
// func SetUpAccountRoutes(app *fiber.App, accountHandler *handler.AccountHandler, authZMiddleware *middleware.AuthZMiddleware) error { ... }

// --- تابع SetUpUserManagementRoutes (در profilemanager/internal/api/router/user.go) ---
// این همان تابعی است که شما ارائه دادید:
// func SetUpUserManagementRoutes(app *fiber.App, userHandler *handler.UserHandler, authZMiddleware *middleware.AuthZMiddleware) error { ... }