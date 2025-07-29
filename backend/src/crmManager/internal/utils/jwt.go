package utils

import (
	"crm-gold/internal/model"
	"errors"
	"fmt"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap" 
)

type JWTValidator interface {
	ValidateToken(token string) (*model.CustomClaims, error)
}

type JWTValidatorImpl struct {
	jwtSecret []byte
	logger    *zap.Logger 
}

func NewJWTValidatorImpl(secretEnvVarName string, logger *zap.Logger) *JWTValidatorImpl {
	jwtSecret := os.Getenv(secretEnvVarName)
	if jwtSecret == "" {
		logger.Fatal(fmt.Sprintf("%s environment variable is not set. Cannot initialize JWTValidator.", secretEnvVarName))
	}
	return &JWTValidatorImpl{
		jwtSecret: []byte(jwtSecret),
		logger:    logger,
	}
}

func (v *JWTValidatorImpl) ValidateToken(tokenString string) (*model.CustomClaims, error) {
	if v.jwtSecret == nil || len(v.jwtSecret) == 0 {
		v.logger.Error("JWT Secret Key is not initialized in JWTValidatorImpl. Cannot validate JWT.")
		return nil, errors.New("jwt secret key not configured in validator")
	}

	token, err := jwt.ParseWithClaims(tokenString, &model.CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return v.jwtSecret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, errors.New("token expired")
		}
		if errors.Is(err, jwt.ErrSignatureInvalid) {
			return nil, errors.New("invalid token signature")
		}
		return nil, fmt.Errorf("token parsing or validation failed: %w", err)
	}

	claims, ok := token.Claims.(*model.CustomClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims or token is not valid")
	}

	return claims, nil
}
