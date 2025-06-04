package middleware

import (
	"profile-gold/internal/model" // Assuming ErrorResponse is here
	"profile-gold/internal/utils" // For Log
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
	// "github.com/golang-jwt/jwt/v5" // Would be needed for actual JWT validation
)

// PlaceholderAuthMiddleware simulates JWT validation and extracts/sets userID.
// A real implementation would validate the token against a secret/public key
// and parse claims.
func PlaceholderAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			utils.Log.Warn("AuthMiddleware (PM): Missing Authorization header")
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Missing Authorization header.", Code: "401_MISSING_AUTH_HEADER",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			utils.Log.Warn("AuthMiddleware (PM): Invalid Authorization header format", zap.String("header", authHeader))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Invalid Authorization header format.", Code: "401_INVALID_AUTH_FORMAT",
			})
		}

		tokenString := parts[1]

		// --- BEGIN JWT Validation Placeholder ---
		// In a real app:
		// 1. Parse tokenString using jwt.ParseWithClaims or similar.
		// 2. Validate signature, expiry, issuer, etc.
		// 3. Extract userID from claims.
		// For this placeholder, we'll assume a dummy userID if token is "valid-dummy-token-user123".
		if tokenString == "valid-dummy-token-user123" { // Replace with actual JWT validation logic
			userID := "user123" // Dummy User ID extracted from token
			c.Locals("userID", userID)
			utils.Log.Info("AuthMiddleware (PM): User authenticated (placeholder)", zap.String("userID", userID))
			return c.Next()
		}
		// --- END JWT Validation Placeholder ---

		// If token is not our dummy one, or if real validation fails:
		utils.Log.Warn("AuthMiddleware (PM): Invalid token (placeholder)", zap.String("token", tokenString))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Unauthorized: Invalid or expired token.", Code: "401_INVALID_TOKEN",
		})
	}
}
