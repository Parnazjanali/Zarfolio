package server

import (
	"fmt"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/repository/db/postgresDb"
	redisdb "profile-gold/internal/repository/db/redisDb"
	"profile-gold/internal/service"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// StartServer now accepts RedisService and CounterpartyService
func StartServer(port string, redisServiceInstance *service.RedisService, counterpartyServiceInstance service.CounterpartyService) {
	utils.Log.Info("Initializing Profile Manager Fiber server...")

	app := fiber.New()
	utils.Log.Info("Profile Manager Fiber app instance created.")

	// Configure static file serving for profile pictures
	staticFilesRoot := "./uploads" // Physical directory on server
	urlPrefix := "/uploads"        // URL prefix clients will use

	app.Static(urlPrefix, staticFilesRoot, fiber.Static{
		Compress:  true,
		ByteRange: true,
		Browse:    false,
	})
	utils.Log.Info("Static file serving configured", zap.String("url_prefix", urlPrefix), zap.String("filesystem_root", staticFilesRoot))

	// Redis client initialization is now expected to be done in main.go before StartServer is called.
	// The redisServiceInstance is passed in.
	// Ensure that the redis client used by other parts (like tokenRepo below) is consistent
	// with the one initialized for redisServiceInstance if they are intended to be the same.
	// For now, we assume utils.RedisClient is populated by the same InitRedis in main.go or is a separate client.

	utils.Log.Info("Initializing UserRepository...")
	userRepo := postgresDb.NewPostgresUserRepository(postgresDb.DB)

	if userRepo == nil {
		utils.Log.Fatal("Failed to initialize UserRepository (PostgresUserRepository). Exiting application.")
	}
	utils.Log.Info("UserRepository initialized successfully (using PostgreSQL).")

	utils.Log.Info("Initializing TokenRepository (Redis)...")

	// FIX: Changed utils.RedisClient to service.GetClient() to use the correctly initialized client.
	var tokenRepo redisdb.TokenRepository = redisdb.NewRedisTokenRepository(service.GetClient())

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

	// Pass redisServiceInstance to NewAuthHandler
	authHandler := handler.NewAuthHandler(userService, redisServiceInstance)
	if authHandler == nil {
		utils.Log.Fatal("Failed to initialize AuthHandler. Exiting application.")
	}

	profileHandler := handler.NewProfileHandler(userService) // Assuming ProfileHandler does not need Redis/CounterpartyService for now

	if profileHandler == nil {
		utils.Log.Fatal("Failed to initialize ProfileHandler. Exiting application.") // Corrected log message from AuthHandler
	}
	utils.Log.Info("AuthHandler and ProfileHandler initialized successfully.")

	utils.Log.Info("Initializing AccountHandler...")
	accountHandler := handler.NewAccountHandler(userService)
	if accountHandler == nil {
		utils.Log.Fatal("Failed to initialize AccountHandler. Exiting application.")
	}
	utils.Log.Info("AccountHandler initialized successfully.")

	// Initialize CounterpartyHandler
	utils.Log.Info("Initializing CounterpartyHandler...")
	counterpartyHandler := handler.NewCounterpartyHandler(counterpartyServiceInstance, utils.Log)
	if counterpartyHandler == nil {
		utils.Log.Fatal("Failed to initialize CounterpartyHandler. Exiting application.")
	}
	utils.Log.Info("CounterpartyHandler initialized successfully.")


	utils.Log.Info("Setting up Profile Manager API routes...")

	// Pass redisServiceInstance and counterpartyHandler to SetupProfileManagerRoutes
	if err := SetupProfileManagerRoutes(app, authHandler, profileHandler, accountHandler, counterpartyHandler, tokenRepo, redisServiceInstance); err != nil {
		utils.Log.Fatal("Failed to set up Profile Manager API routes. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("Profile Manager API routes configured successfully.")

	fullAddr := fmt.Sprintf("0.0.0.0%s", port)
	utils.Log.Info("Profile Manager is attempting to listen", zap.String("address", fullAddr))

	if err := app.Listen(port); err != nil {
		utils.Log.Fatal("Profile Manager server failed to start", zap.Error(err))
	}
}