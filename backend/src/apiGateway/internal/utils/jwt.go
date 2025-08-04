package utils

import (
    "errors"
    "fmt"
    "os"

    "github.com/golang-jwt/jwt/v5"
    "go.uber.org/zap"

    "gold-api/internal/model"
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

    claims := &model.CustomClaims{}
    token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return v.jwtSecret, nil
    })

    if err != nil {
        v.logger.Error("Failed to parse or validate JWT token", zap.Error(err))
        return nil, err
    }

    if !token.Valid {
        v.logger.Warn("Invalid JWT token received")
        return nil, errors.New("invalid token")
    }

    return claims, nil
}