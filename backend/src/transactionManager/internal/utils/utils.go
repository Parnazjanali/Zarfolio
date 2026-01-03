package utils

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
)

func GenerateUUID() string {

	newUUID := uuid.New().String()

	return fmt.Sprintf("tr-%s", newUUID)
}

func IsNotFoundError(err error) bool {
	return strings.Contains(err.Error(), "404") || strings.Contains(err.Error(), "not found")
}
