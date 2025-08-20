package main

import (
	"fmt"
	"log"
	"notificationManager/internal/api"
	"notificationManager/internal/model"
	"notificationManager/internal/repository"
	"notificationManager/internal/service"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"github.com/robfig/cron/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using default environment variables")
	}

	// Connect to database
	dbHost := os.Getenv("DB_HOST")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbPort := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable", dbHost, dbUser, dbPassword, dbName, dbPort)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Migrate the schema
	db.AutoMigrate(&model.Notification{}, &model.NotificationRead{})

	// Create repository and service
	notificationRepo := repository.NewNotificationRepository(db)
	notificationService := service.NewNotificationService(notificationRepo)

	// Start cron job
	c := cron.New()
	c.AddFunc("@every 1m", func() {
		fmt.Println("Running cron job to send scheduled notifications")
		notificationService.SendScheduledNotifications()
	})
	c.Start()

	// Create Fiber app
	app := fiber.New()
	app.Use(logger.New())

	// Create API handler
	httpHandler := api.NewHTTPHandler(notificationService)

	// Setup routes
	apiGroup := app.Group("/api")
	apiGroup.Post("/notifications", httpHandler.CreateNotification)
	apiGroup.Get("/notifications", httpHandler.GetAllNotifications)
	apiGroup.Get("/users/:user_id/notifications", httpHandler.GetUserNotifications)
	apiGroup.Post("/notifications/read", httpHandler.MarkNotificationAsRead)
	apiGroup.Get("/notifications/:notification_id/status", httpHandler.GetNotificationReadStatus)


	// Start server
	serverPort := os.Getenv("PORT")
	if serverPort == "" {
		serverPort = "8084"
	}
	log.Printf("Server is running on port %s", serverPort)
	log.Fatal(app.Listen(":" + serverPort))
}
