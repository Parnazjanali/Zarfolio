package utils

import (
	"errors"
	"fmt"

	"gold-api/internal/model" // Make sure this path is correct for apiGateway's model package (for CustomClaims)

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

// Define your JWT secret here (should be loaded from environment variables in production)
// This secret MUST be the same as the one used in profileManager
var jwtSecret = []byte("YOUR_SUPER_SECRET_JWT_KEY_HERE_FROM_ENV") // **IMPORTANT: Use the same secret as ProfileManager!**

// CustomClaims struct to include user roles and permissions
// This struct MUST be identical to the one in profileManager/internal/model/model.go
// or profileManager/internal/utils/jwt.go, depending on where you put it.
// Here, we import it from model, so make sure it's in gold-api/internal/model/model.go
// type CustomClaims struct { ... } // This is now imported from model.CustomClaims

// GenerateToken (Optional in API Gateway): API Gateway typically doesn't generate tokens, but validates them.
// If your API Gateway needs to generate tokens (e.g., for internal service communication), you'd keep this.
// For now, we only focus on ValidateToken.
// func GenerateToken(userID, username string, roles []string, expiration time.Duration) (string, error) {
//     // ... (same as profileManager's GenerateToken)
// }

// ValidateToken validates the JWT token and returns the claims.
// This function MUST be identical to the one in profileManager/internal/utils/jwt.go
// to ensure consistent token validation.
func ValidateToken(tokenString string) (*model.CustomClaims, error) { // Returns *model.CustomClaims
	claims := &model.CustomClaims{} // Use model.CustomClaims
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		Log.Error("Failed to parse or validate JWT token", zap.Error(err))
		return nil, err
	}

	if !token.Valid {
		Log.Warn("Invalid JWT token received")
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// min helper function (since math.Min works on floats) - copied from AuthHandler discussion
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
