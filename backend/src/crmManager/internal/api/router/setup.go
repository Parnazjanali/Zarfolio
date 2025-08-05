package router

import (
	"crm-gold/internal/api/handler"
	"crm-gold/internal/api/middleware"
	"crm-gold/internal/utils"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

func SetUpAllRoutes(app *fiber.App, crmHandler *handler.CrmHandler, AuthZMiddleware *middleware.AuthZMiddleware) error {
	if app == nil {
		return fmt.Errorf("fiber app instance cannot be nil in SetUpAllRoutes.")
	}
	if crmHandler == nil {
		return fmt.Errorf("crmHandler is nil in SetUpAllRoutes.")
	}
	if AuthZMiddleware == nil {
		return fmt.Errorf("authz middleware cannot be nil in SetUpAllRoutes.")
	}

	utils.Log.Info("Setting up all routes in SetUpAllRoutes...")

	if err := SetUpCustomerRoutes(app, crmHandler, AuthZMiddleware); err != nil {
		return fmt.Errorf("failed to set up customer routes: %w", err)
	}
	utils.Log.Info("All routes set up successfully in SetUpAllRoutes.")
	
	return nil

}
