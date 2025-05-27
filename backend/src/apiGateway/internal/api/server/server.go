package server

import (
	"fmt"
	"gold-api/internal/api/middleware"
	"gold-api/internal/utils"
	"log"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func StartServer(port string) {
	utils.InitLogger()

	utils.Log.Info("Starting Fiber Api Gateway server")

	app := fiber.New()
	utils.Log.Info("Fiber app instance created")

	app.Use(middleware.CorsMiddleware())
	utils.Log.Info("CORS middleware applied")

	apiGatewayBaseUrl := "http://localhost:8080"
	utils.Log.Info("Initializing ProfileManagerClient", zap.String("url", apiGatewayBaseUrl))

	fullAddr := fmt.Sprintf("0.0.0.0%s", port) // Listen on all network interfaces
	utils.Log.Info("API Gateway is attempting to listen", zap.String("address", fullAddr))

	log.Fatal(app.Listen(port)) 
}
