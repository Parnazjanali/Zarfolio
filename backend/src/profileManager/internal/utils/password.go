package utils

import (
	"fmt"

	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

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
