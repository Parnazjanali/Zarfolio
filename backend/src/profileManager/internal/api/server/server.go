package server

import (
	"log"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SeutUpServer(port string) {
	utils.Log.Info("Initializing Profile Manager Fiber server...", zap.String("port", port))

	app := fiber.New()
	utils.Log.Info("Profile Manager Fiber App instance created")
	utils.Log.Info("Initializing UserRepository...")

	log.Fatal(app.Listen(port))
}
