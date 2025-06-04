package middleware

import (
	"errors"
	"strings"

	"profile-gold/internal/model"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"

	redisdb "profile-gold/internal/repository/db/redisDb" // Import for TokenRepository
)

func AuthMiddleware(tokenRepo redisdb.TokenRepository) fiber.Handler { // Added tokenRepo parameter
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			utils.Log.Warn("Authorization header missing for protected route",
				zap.String("path", c.Path()), zap.String("ip", c.IP()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Authorization header required",
				Code:    "401",
			})
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || strings.ToLower(tokenParts[0]) != "bearer" {
			utils.Log.Warn("Invalid Authorization header format",
				zap.String("header", authHeader), zap.String("ip", c.IP()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid Authorization header format. Expected 'Bearer [token]'.",
				Code:    "401",
			})
		}
		tokenString := tokenParts[1]

		claims, err := utils.ValidateJWTToken(tokenString)
		if err != nil {
			utils.Log.Error("JWT token validation failed", zap.Error(err),
				zap.String("token_part", tokenString[:utils.Min(len(tokenString), 30)]+"..."))
			if errors.Is(err, jwt.ErrSignatureInvalid) || errors.Is(err, jwt.ErrTokenMalformed) {
				return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
					Message: "Invalid token signature or format.",
					Code:    "401",
				})
			}
			if errors.Is(err, jwt.ErrTokenExpired) {
				return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
					Message: "Token has expired.",
					Code:    "401",
				})
			}
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid or expired token.",
				Code:    "401",
			})
		}

		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		c.Locals("role", claims.Role)

		// Check if token is blacklisted
		isBlacklisted, errBlacklist := tokenRepo.IsTokenBlacklisted(c.Context(), tokenString) // Pass fiber context
		if errBlacklist != nil {
			utils.Log.Error("AuthMiddleware: Error checking token blacklist", zap.Error(errBlacklist), zap.String("token_part", tokenString[:utils.Min(len(tokenString), 30)]+"..."))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
				Message: "Error verifying token status.", Code: "500_BLACKLIST_CHECK_FAILED",
			})
		}
		if isBlacklisted {
			utils.Log.Warn("AuthMiddleware: Attempt to use a blacklisted (logged out) token",
				zap.String("token_part", tokenString[:utils.Min(len(tokenString), 30)]+"..."),
				zap.String("userID", claims.UserID))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Token is no longer valid (logged out).", Code: "401_TOKEN_BLACKLISTED",
			})
		}

		utils.Log.Info("JWT token validated successfully",
			zap.String("username", claims.Username), zap.String("role", claims.Role), zap.String("path", c.Path()))

		return c.Next()
	}
}
