package middleware

import (
	"errors" // For errors.Is
	"profile-gold/internal/model"   // Assuming ErrorResponse is here
	"profile-gold/internal/service" // Required for RedisService
	"profile-gold/internal/utils"   // For Log and ValidateJWTToken
	"strings"
	// "time" // Not strictly needed here unless doing time calculations directly
	"fmt" // Added for fmt.Errorf

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5" // For jwt.ErrTokenExpired etc.
	"go.uber.org/zap"
)

// AuthMiddleware provides authentication middleware that checks JWT validity and revocation status.
type jwtAuthMiddleware struct {
	redisService *service.RedisService // Use the pointer to the struct
	logger       *zap.Logger
}

// NewAuthMiddleware creates a new AuthMiddleware instance.
func NewAuthMiddleware(rs *service.RedisService, logger *zap.Logger) *jwtAuthMiddleware {
	if rs == nil {
		// This should ideally cause a panic or be handled by a global logger if logger is also nil
		panic("RedisService cannot be nil for AuthMiddleware")
	}
	if logger == nil { // Check logger only after checking required dependencies
		// Fallback to utils.Log if no specific logger provided, or panic if utils.Log is also nil
		if utils.Log == nil {
			panic(fmt.Errorf("logger is nil and utils.Log is not initialized for AuthMiddleware"))
		}
		logger = utils.Log
	}
	return &jwtAuthMiddleware{redisService: rs, logger: logger}
}

// Authenticate is the Fiber handler for JWT authentication and blacklist checking.
func (am *jwtAuthMiddleware) Authenticate() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			am.logger.Warn("AuthMiddleware: Missing Authorization header")
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Missing Authorization header.", Code: "401_MISSING_AUTH_HEADER",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			am.logger.Warn("AuthMiddleware: Invalid Authorization header format", zap.String("header", authHeader))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Invalid Authorization header format.", Code: "401_INVALID_AUTH_FORMAT",
			})
		}

		tokenString := parts[1]

		// 1. Validate the token structure and claims (expiry, signature etc.)
		claims, err := utils.ValidateJWTToken(tokenString) // ValidateJWTToken is from utils/jwt.go
		if err != nil {
			// Use utils.Min for safe prefix logging
			tokenPrefix := tokenString
			if len(tokenString) > 10 {
				tokenPrefix = tokenString[:utils.Min(10, len(tokenString))]
			}
			am.logger.Warn("AuthMiddleware: JWT validation failed", zap.String("token_prefix", tokenPrefix), zap.Error(err))

			// Specific error messages based on the type of validation error
			if errors.Is(err, jwt.ErrTokenExpired) {
				return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Token has expired.", Code: "401_TOKEN_EXPIRED"})
			}
			// Add more specific errors as needed, e.g., from utils.ValidateJWTToken if it returns custom errors
			if errors.Is(err, jwt.ErrTokenMalformed) { // Example, assuming ValidateJWTToken could wrap this
				return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Malformed token.", Code: "401_TOKEN_MALFORMED"})
			}
			if errors.Is(err, jwt.ErrTokenSignatureInvalid) { // Example
				return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Invalid token signature.", Code: "401_TOKEN_SIGNATURE_INVALID"})
			}
			// Generic error for other validation issues
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Invalid token.", Code: "401_INVALID_TOKEN"})
		}

		// 2. Check if the token (via its JTI) is blacklisted in Redis
		jti := claims.RegisteredClaims.ID
		if jti == "" {
			am.logger.Error("AuthMiddleware: JTI claim is missing in a validated token. This should not happen.", zap.String("userID", claims.UserID))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
				Message: "Internal Server Error: Critical token data missing.", Code: "500_JTI_MISSING",
			})
		}

		isRevoked, err := am.redisService.IsBlacklisted(jti)
		if err != nil {
			am.logger.Error("AuthMiddleware: Redis check failed for JTI", zap.String("jti", jti), zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
				Message: "Internal Server Error: Could not verify token status.", Code: "500_REDIS_ERROR",
			})
		}

		if isRevoked {
			am.logger.Info("AuthMiddleware: Access attempt with revoked token", zap.String("jti", jti), zap.String("userID", claims.UserID))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Token has been revoked.", Code: "401_TOKEN_REVOKED",
			})
		}

		// 3. Token is valid and not revoked. Set user context.
		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role", claims.Role)
		c.Locals("jti", jti) // Can be useful for logging or other downstream processing
		c.Locals("claims", claims) // Pass all claims if needed

		am.logger.Debug("AuthMiddleware: User authenticated successfully", zap.String("userID", claims.UserID), zap.String("jti", jti))
		return c.Next()
	}
}

// Note: utils.Min function is assumed to be defined in the utils package.
// No local Min function needed here.
