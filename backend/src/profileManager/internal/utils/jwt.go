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

type JWTValidator interface {
    ValidateToken(token string) (*model.CustomClaims, error)
}

type JWTValidatorImpl struct {
    jwtSecret []byte 
}

func NewJWTValidatorImpl() *JWTValidatorImpl {
    jwtSecret := os.Getenv("JWT_SECRET_KEY")
    if jwtSecret == "" {
        Log.Fatal("JWT_SECRET_KEY environment variable is not set. Cannot initialize JWTValidator.")
        
    }
    return &JWTValidatorImpl{
        jwtSecret: []byte(jwtSecret), 
    }
}

func GenerateJWTToken(user *model.User) (string, *model.CustomClaims, error) {
   
    jwtSecret := os.Getenv("JWT_SECRET_KEY")
    if jwtSecret == "" {
        Log.Fatal("JWT_SECRET_KEY environment variable is not set. Cannot generate JWT.")
    }

    expirationTime := time.Now().Add(24 * time.Hour)

    claims := &model.CustomClaims{
        UserID:   user.ID,
        Username: user.Username,
        Roles:    user.Roles, 
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
        zap.Any("roles", user.Roles), 
        zap.Time("expires_at", expirationTime))

    return tokenString, claims, nil
}


func (v *JWTValidatorImpl) ValidateToken(tokenString string) (*model.CustomClaims, error) {
    if v.jwtSecret == nil || len(v.jwtSecret) == 0 { 
        Log.Error("JWT Secret Key is not initialized in JWTValidatorImpl. Cannot validate JWT.")
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

    // `token.Valid` already checks expiration, but explicit check can be useful for specific error types
    // if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
    //     return nil, jwt.ErrTokenExpired
    // }

    return claims, nil
}