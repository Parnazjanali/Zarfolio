package router

import (
	"fmt"
	"log"
	"profile-gold/internal/api/authz"
	"profile-gold/internal/api/handler"
	"profile-gold/internal/api/middleware"
	"profile-gold/internal/repository/db/postgresDb"
	redisdb "profile-gold/internal/repository/db/redisDb"
	"profile-gold/internal/service/account"
	authService "profile-gold/internal/service/auth"
	"profile-gold/internal/service/user"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func StartServer(port string) {
	utils.Log.Info("Initializing Profile Manager Fiber server...")

	app := fiber.New()
	utils.Log.Info("Profile Manager Fiber app instance created.")

	app.Use(middleware.CorsMiddleware()) 
	utils.Log.Info("CORS middleware applied.")

	utils.Log.Info("Initializing Redis client for Profile Manager...")
	if err := redisdb.InitRedisClient(); err != nil {
		utils.Log.Fatal("Failed to initialize Redis client. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("Redis client initialized successfully.")

	utils.Log.Info("Initializing PostgreSQL Database...")
	if postgresDb.DB == nil { 
		utils.Log.Fatal("PostgreSQL DB connection is nil. Exiting application.")
	}
	utils.Log.Info("PostgreSQL DB connection ready.")

	utils.Log.Info("Initializing Repositories...")
	userRepo := postgresDb.NewPostgresUserRepository(postgresDb.DB)
	if userRepo == nil {
		utils.Log.Fatal("Failed to initialize UserRepository. Exiting application.")
	}
	utils.Log.Info("UserRepository initialized successfully.")

	tokenRepo := redisdb.NewRedisTokenRepository(redisdb.RedisClient)
	if tokenRepo == nil {
		utils.Log.Fatal("Failed to initialize TokenRepository. Exiting application.")
	}
	utils.Log.Info("TokenRepository initialized successfully.")

	utils.Log.Info("Initializing Services...")
	permissionService := authz.NewPermissionService(utils.Log) 
	if permissionService == nil {                              
		utils.Log.Fatal("Failed to initialize PermissionService. Exiting application.")
	}
	utils.Log.Info("PermissionService initialized successfully.")

	jwtValidator := utils.NewJWTValidatorImpl() 
	utils.Log.Info("JWTValidator initialized successfully.")

	
	authSvc := authService.NewAuthService(userRepo, tokenRepo, jwtValidator) // <-- فرضا این متد سازنده AuthService است.
	if authSvc == nil {
		utils.Log.Fatal("Failed to initialize AuthService. Exiting application.")
	}
	utils.Log.Info("AuthService initialized successfully.")

	accountSvc := account.NewAccountService(userRepo, tokenRepo) // فرضاً این متد سازنده AccountService است.
	if accountSvc == nil {
		utils.Log.Fatal("Failed to initialize AccountService. Exiting application.")
	}
	utils.Log.Info("AccountService initialized successfully.")

	// --- User Service (برای مدیریت کاربران توسط Admin) ---
	userSvc := user.NewUserService(userRepo, permissionService) // فرضاً این متد سازنده UserService است.
	if userSvc == nil {
		utils.Log.Fatal("Failed to initialize UserService. Exiting application.")
	}
	utils.Log.Info("UserService initialized successfully.")

	utils.Log.Info("Initializing Handlers...")
	authHandler := handler.NewAuthHandler(authSvc)
	if authHandler == nil {
		utils.Log.Fatal("Failed to initialize AuthHandler. Exiting application.")
	}
	utils.Log.Info("AuthHandler initialized.")

	accountHandler := handler.NewAccountHandler(accountSvc) // <-- AccountHandler باید AccountService را بگیرد
	if accountHandler == nil {
		utils.Log.Fatal("Failed to initialize AccountHandler. Exiting application.")
	}
	utils.Log.Info("AccountHandler initialized.")

	userHandler := handler.NewUserHandler(userSvc) // <-- UserHandler باید UserService را بگیرد
	if userHandler == nil {
		utils.Log.Fatal("Failed to initialize UserHandler. Exiting application.")
	}
	utils.Log.Info("UserHandler initialized.")

	// --- Initialize AuthZMiddleware ---
	authZMiddleware := middleware.NewAuthZMiddleware(permissionService, utils.Log, jwtValidator) // <-- تمام وابستگی‌ها به درستی تزریق شده‌اند
	// NewAuthZMiddleware هم پنیک میکند

	utils.Log.Info("All core dependencies initialized successfully.")
	utils.Log.Info("Setting up Profile Manager API routes...")

	// --- Setup all API routes ---
	// `SetupAllRoutes` باید تمام هندلرهای لازم و `authZMiddleware` را دریافت کند.
	if err := SetupAllRoutes(app, authHandler, accountHandler, userHandler, authZMiddleware); err != nil {
		utils.Log.Fatal("Failed to set up Profile Manager API routes. Exiting application.", zap.Error(err))
	}
	utils.Log.Info("Profile Manager API routes configured successfully.")

	fullAddr := fmt.Sprintf("0.0.0.0%s", port)
	utils.Log.Info("Profile Manager is attempting to listen", zap.String("address", fullAddr))

	log.Fatal(app.Listen(port)) // Start listening for requests
}
