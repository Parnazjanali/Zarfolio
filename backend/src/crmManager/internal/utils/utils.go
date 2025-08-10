package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

func GenerateSecureRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}

func PtrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func PtrFloat64(f float64) *float64 {
	return &f
}

