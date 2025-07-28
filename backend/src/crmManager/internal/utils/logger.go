package utils

import (
	"fmt"

	"go.uber.org/zap"
)

var Log *zap.Logger

func InitLogger() error {
	cfg := zap.NewProductionConfig()
	cfg.Level.SetLevel(zap.DebugLevel)
	logger, err := cfg.Build()
	if err != nil {
		return fmt.Errorf("failed to build zap logger: %w", err)
	}
	Log = logger
	return nil
}
