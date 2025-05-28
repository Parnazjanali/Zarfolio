package server

import (
	"fmt"
	"log"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/repository/db/postgresDb"
	"profile-gold/internal/service"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func StartServer(port string) {
	 utils.Log.Info("Initializing Profile Manager Fiber server...")

    app := fiber.New()
    utils.Log.Info("Profile Manager Fiber app instance created.")

    utils.Log.Info("Initializing database connection for Profile Manager...")
    postgresDb.InitDB() 
    utils.Log.Info("Database connection established for Profile Manager.")

    utils.Log.Info("Initializing UserRepository...")
    var userRepo postgresDb.UserRepository 

    userRepo = postgresDb.NewPostgresUserRepository(postgresDb.DB) 

    if userRepo == nil {
        utils.Log.Fatal("Failed to initialize UserRepository (PostgresUserRepository). Exiting application.")
    }
    utils.Log.Info("UserRepository initialized successfully (using PostgreSQL).") 


    utils.Log.Info("Initializing UserService...")
    userService := service.NewUserService(userRepo) 
    if userService == nil {
        utils.Log.Fatal("Failed to initialize UserService. Exiting application.")
    }
    utils.Log.Info("UserService initialized successfully.")

    utils.Log.Info("Initializing AuthHandler and ProfileHandler...")
    authHandler := handler.NewAuthHandler(userService) 
    if authHandler == nil { 
        utils.Log.Fatal("Failed to initialize AuthHandler. Exiting application.")
    }
    utils.Log.Info("Handlers initialized successfully.")

    utils.Log.Info("Setting up Profile Manager API routes...")
    
    if err := SetupProfileManagerRoutes(app, authHandler, nil ); err != nil {
        utils.Log.Fatal("Failed to set up Profile Manager API routes. Exiting application.", zap.Error(err))
    }
    utils.Log.Info("Profile Manager API routes configured successfully.")

    fullAddr := fmt.Sprintf("0.0.0.0%s", port)
    utils.Log.Info("Profile Manager is attempting to listen", zap.String("address", fullAddr))

    log.Fatal(app.Listen(port))
}
