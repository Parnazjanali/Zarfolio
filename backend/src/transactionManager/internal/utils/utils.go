package utils

import (
	"fmt"

	"github.com/google/uuid"
)

func GenerateUUID() string {

	newUUID := uuid.New().String()
	
	return fmt.Sprintf("tr-%s", newUUID)
}
