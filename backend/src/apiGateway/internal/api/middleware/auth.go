package middleware

import (
	"errors"                  // For custom error types if needed, or for errors.Is
	"gold-api/internal/model" // For ErrorResponse
	"gold-api/internal/service" // +++ ADDED FOR ProfileManagerClient
	"gold-api/internal/utils" // For Log
	"os"                      // For environment variable access
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

// CustomClaims defines the structure for JWT claims used in apiGateway.
// This should ideally match or be compatible with the claims structure used when generating tokens.
type CustomClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthUser is a middleware for JWT authentication and authorization.
// +++ START OF CHANGE +++
// The middleware now depends on the ProfileManagerClient interface to perform its check.
func AuthUser(authService service.ProfileManagerClient) fiber.Handler {
// +++ END OF CHANGE +++
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			utils.Log.Warn("AuthUser (apiGateway): Missing Authorization header")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Unauthorized: Missing Authorization header.", Code: "AG401_MISSING_AUTH_HEADER",
		})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		utils.Log.Warn("AuthUser (apiGateway): Invalid Authorization header format", zap.String("header", authHeader))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Unauthorized: Invalid Authorization header format. Expected 'Bearer <token>'.", Code: "AG401_INVALID_AUTH_FORMAT",
		})
	}

	tokenString := parts[1]
	if tokenString == "" {
		utils.Log.Warn("AuthUser (apiGateway): Token string is empty")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Unauthorized: Token not provided.", Code: "AG401_TOKEN_EMPTY",
		})
	}
	jwtSecret := os.Getenv("JWT_SECRET_KEY")
	if jwtSecret == "" { // This check should ideally not be met with a hardcoded non-empty value
		utils.Log.Error("AuthUser (apiGateway): JWT_SECRET_KEY (hardcoded) is unexpectedly empty. This should not happen.")
		// In a real scenario, you might want to prevent startup if this isn't set,
		// or have a more robust configuration system.
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Server configuration error: JWT secret (hardcoded) is empty.", Code: "AG500_JWT_SECRET_HARDCODED_EMPTY",
		})
	}

	claims := &CustomClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method is what you expect (e.g., HS256)
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			utils.Log.Warn("AuthUser (apiGateway): Unexpected signing method in token", zap.Any("alg", token.Header["alg"]))
			return nil, errors.New("unexpected signing method")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		utils.Log.Warn("AuthUser (apiGateway): Error parsing or validating token", zap.Error(err))
		if errors.Is(err, jwt.ErrTokenMalformed) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Malformed token.", Code: "AG401_TOKEN_MALFORMED"})
		} else if errors.Is(err, jwt.ErrTokenExpired) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Token has expired.", Code: "AG401_TOKEN_EXPIRED"})
		} else if errors.Is(err, jwt.ErrTokenNotValidYet) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Token not active yet.", Code: "AG401_TOKEN_NOT_ACTIVE"})
		} else { // Other errors, e.g., signature invalid
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Invalid token.", Code: "AG401_INVALID_TOKEN"})
		}
	}

	if !token.Valid {
		utils.Log.Warn("AuthUser (apiGateway): Token marked as invalid by library, though no specific parse error caught above.")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Invalid token.", Code: "AG401_TOKEN_INVALID_FLAG"})
	}

	// Check for required claims
	if claims.UserID == "" {
		utils.Log.Warn("AuthUser (apiGateway): UserID missing from token claims", zap.Any("claims", claims))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Invalid token claims (UserID missing).", Code: "AG401_MISSING_USERID_CLAIM"})
	}

	// +++ START OF CHANGE +++
	// Step 2: Remote validation against the blacklist via profileManager.
	err = authService.VerifyToken(tokenString) // We re-use 'err' from ParseWithClaims, it should be nil here if local validation passed.
	if err != nil {
		utils.Log.Warn("Token revocation check failed via profileManager", zap.Error(err), zap.String("userID", claims.UserID))
		// Check if the error is due to the profile manager being down.
		// The exact error type or message to check might depend on how ErrProfileManagerDown is defined and returned by the client.
		// For this example, we'll assume it could be checked using errors.Is or by inspecting the error message.
		// For now, adhering to the prompt's requirement of 401 for any VerifyToken error.
		// if errors.Is(err, service.ErrProfileManagerDown) { // service.ErrProfileManagerDown would need to be exported or checkable
		//  utils.Log.Error("Profile Manager service is down during token verification", zap.Error(err))
		//	// Consider returning 503 Service Unavailable if the profile service is confirmed to be down.
		//	// return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "Authentication service temporarily unavailable.", Code: "AG503_AUTH_SERVICE_DOWN"})
		// }
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Token has been revoked or is no longer valid.", Code: "AG401_TOKEN_REVOKED_OR_INVALID"})
	}
	// +++ END OF CHANGE +++

	// Set user information in locals for downstream handlers
	c.Locals("userID", claims.UserID)
	c.Locals("userRole", claims.Role)  // Store role if present and used
	c.Locals("tokenClaims", claims)    // Store all claims if needed by some handlers
	c.Locals("userToken", tokenString) // Store the raw token if it needs to be forwarded

	utils.Log.Info("AuthUser (apiGateway): User authenticated successfully (local and remote)", zap.String("userID", claims.UserID), zap.String("role", claims.Role))
	return c.Next()
	}
}
