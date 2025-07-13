package utils

import (
	"crypto/rand"
	"fmt"
	"time"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

func GenerateUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		Log.Error("Failed to generate UUID:", zap.Error(err))
		return fmt.Sprintf("error-uuid-%d", time.Now().UnixNano())
	}
	uuid := fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
	return uuid
}

func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hashedPassword), nil
}

func CheckPasswordHash(password, hash string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		Log.Debug("PasswordUtil: bcrypt comparison FAILED", zap.Error(err))
	} else {
		Log.Debug("PasswordUtil: bcrypt comparison SUCCESS")
	}
	return err
}
