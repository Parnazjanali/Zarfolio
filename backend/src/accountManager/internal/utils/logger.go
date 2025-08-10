package utils

import (
	"fmt"

	"go.uber.org/zap"
)

func InitLogger() (*zap.Logger, error) {
	logger, err := zap.NewProduction()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize logger: %w", err)
	}
	return logger, nil
}
