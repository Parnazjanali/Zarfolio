package utils // Or your specific utils package name

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

func GenerateSecureRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to read random bytes for token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}
