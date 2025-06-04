package server

import (
	"fmt"
	"log"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/repository/db/postgresDb"
	redisdb "profile-gold/internal/repository/db/redisDb"
	"profile-gold/internal/service"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func StartServer(port string) {
	utils.Log.Info("Initializing Profile Manager Fiber server...")

	app := fiber.New()
	utils.Log.Info("Profile Manager Fiber app instance created.")

	utils.Log.Info("Initializing Redis client for Profile Manager...")
	if err := utils.InitRedisClient(); err != nil {
		utils.Log.Fatal("Failed to initialize Redis client. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("Redis client initialized successfully.")

	utils.Log.Info("Initializing UserRepository...")
	userRepo := postgresDb.NewPostgresUserRepository(postgresDb.DB)

	if userRepo == nil {
		utils.Log.Fatal("Failed to initialize UserRepository (PostgresUserRepository). Exiting application.")
	}
	utils.Log.Info("UserRepository initialized successfully (using PostgreSQL).")

	utils.Log.Info("Initializing TokenRepository (Redis)...")

	var tokenRepo redisdb.TokenRepository = redisdb.NewRedisTokenRepository(utils.RedisClient)

	if tokenRepo == nil {
		utils.Log.Fatal("Failed to initialize TokenRepository. Exiting application.")
	}
	utils.Log.Info("TokenRepository initialized successfully (using Redis).")

	// Initialize PasswordResetTokenRepository
	utils.Log.Info("Initializing PasswordResetTokenRepository (PostgreSQL)...")
	passwordResetTokenRepo := postgresDb.NewPostgresPasswordResetTokenRepository(postgresDb.DB)
	if passwordResetTokenRepo == nil {
		utils.Log.Fatal("Failed to initialize PasswordResetTokenRepository. Exiting application.")
	}
	utils.Log.Info("PasswordResetTokenRepository initialized successfully.")

	// Pass it to NewUserService
	utils.Log.Info("Initializing UserService...")
	userService := service.NewUserService(userRepo, tokenRepo, passwordResetTokenRepo) // Added passwordResetTokenRepo
	if userService == nil {
		utils.Log.Fatal("Failed to initialize UserService. Exiting application.")
	}
	utils.Log.Info("UserService initialized successfully.")

	utils.Log.Info("Initializing AuthHandler and ProfileHandler...")

	authHandler := handler.NewAuthHandler(userService)
	if authHandler == nil {
		utils.Log.Fatal("Failed to initialize AuthHandler. Exiting application.")
	}

	profileHandler := handler.NewProfileHandler(userService)

	if profileHandler == nil {
		utils.Log.Fatal("Failed to initialize AuthHandler. Exiting application.")
	}
	utils.Log.Info("Handlers initialized successfully.")

	utils.Log.Info("Setting up Profile Manager API routes...")

	if err := SetupProfileManagerRoutes(app, authHandler, profileHandler); err != nil {
		utils.Log.Fatal("Failed to set up Profile Manager API routes. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("Profile Manager API routes configured successfully.")

	fullAddr := fmt.Sprintf("0.0.0.0%s", port)
	utils.Log.Info("Profile Manager is attempting to listen", zap.String("address", fullAddr))

	log.Fatal(app.Listen(port))
}
