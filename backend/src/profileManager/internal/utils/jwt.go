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

// متغیر کلید را به صورت عمومی تعریف می‌کنیم اما مقداردهی نمی‌کنیم
var jwtKey []byte

// ✅ **اصلاح اصلی: تابع init حذف شد و تابع جدید InitJWT ایجاد شد**
// این تابع باید از main و بعد از راه‌اندازی لاگر فراخوانی شود
func InitJWT() {
	key := os.Getenv("JWT_SECRET_KEY")
	if key == "" {
		// حالا با خیال راحت می‌توانیم از لاگر استفاده کنیم چون می‌دانیم مقداردهی شده است
		Log.Warn("JWT_SECRET_KEY environment variable not set. Using a default, non-secure key. THIS IS NOT SAFE FOR PRODUCTION.")
		key = "default-super-secret-key-that-is-not-safe"
	}
	jwtKey = []byte(key)
	Log.Info("JWT Secret Key initialized.")
}

type CustomClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateJWTToken(user *model.User) (string, *CustomClaims, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &CustomClaims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		Log.Error("Failed to sign JWT token", zap.String("username", user.Username), zap.Error(err))
		return "", nil, fmt.Errorf("failed to sign token: %w", err)
	}

	Log.Info("JWT Token generated successfully",
		zap.String("username", user.Username),
		zap.String("role", string(user.Role)),
		zap.Time("expires_at", expirationTime),
	)

	return tokenString, claims, nil
}

func ValidateJWTToken(tokenString string) (*CustomClaims, error) {
	claims := &CustomClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			Log.Warn("JWT token has expired", zap.Error(err))
			return nil, err
		}
		Log.Error("Failed to parse JWT token", zap.Error(err))
		return nil, fmt.Errorf("token validation failed: %w", err)
	}

	if !token.Valid {
		Log.Warn("Invalid JWT token presented")
		return nil, errors.New("invalid token")
	}

	return claims, nil
}