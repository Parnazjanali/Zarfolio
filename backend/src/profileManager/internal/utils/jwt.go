package utils

import (
	"errors"
	"fmt"
	"os"
	"profile-gold/internal/model"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

type CustomClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateJWTToken(user *model.User) (string, *CustomClaims, error) {
	jwtSecret := os.Getenv("JWT_SECRET_KEY")
	if jwtSecret == "" {
		Log.Fatal("JWT_SECRET_KEY environment variable is not set. Cannot generate JWT.")
	}

	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &CustomClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		Log.Error("Failed to sign JWT token", zap.Error(err), zap.String("username", user.Username))
		return "", nil, fmt.Errorf("failed to sign token: %w", err)
	}

	Log.Info("JWT token generated successfully",
		zap.String("username", user.Username),
		zap.String("role", user.Role),
		zap.Time("expires_at", expirationTime))

	return tokenString, claims, nil
}
func ValidateJWTToken(tokenString string) (*CustomClaims, error) {
	jwtSecret := os.Getenv("JWT_SECRET_KEY")
	if jwtSecret == "" {
		// This should be a fatal error as the application cannot securely validate tokens.
		// Ensure Log is initialized before this function could be called in a real scenario,
		// or use log.Fatalf if Log might not be ready. Given InitLogger is called early in main, Log.Fatal is okay.
		Log.Fatal("JWT_SECRET_KEY environment variable is not set. Cannot validate JWT.")
		// Log.Fatal will exit, so the return below is effectively unreachable but good for clarity.
		return nil, errors.New("critical: jwt secret key not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("token parsing or validation failed: %w", err)
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims or token is not valid")
	}

	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
		return nil, jwt.ErrTokenExpired
	}

	return claims, nil
}
