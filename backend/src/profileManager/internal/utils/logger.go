package utils

import (
	"fmt"
	"os"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Log *zap.Logger

func InitLogger() error {
	cfg := zap.NewProductionConfig()

	// Default log level
	defaultLevel := zapcore.InfoLevel // Changed from zap.DebugLevel

	// Allow overriding log level from environment variable
	envLogLevel := os.Getenv("LOG_LEVEL")
	if envLogLevel != "" {
		switch strings.ToLower(envLogLevel) {
		case "debug":
			defaultLevel = zapcore.DebugLevel
		case "info":
			defaultLevel = zapcore.InfoLevel
		case "warn":
			defaultLevel = zapcore.WarnLevel
		case "error":
			defaultLevel = zapcore.ErrorLevel
		case "fatal":
			defaultLevel = zapcore.FatalLevel
		case "panic":
			defaultLevel = zapcore.PanicLevel
		default:
			// Log a message if the level is invalid, but continue with the default
			// This requires Log to be initialized first, so we can't use utils.Log here yet.
			// fmt.Printf("Warning: Invalid LOG_LEVEL '%s'. Defaulting to '%s'.\n", envLogLevel, defaultLevel.String())
		}
	}

	cfg.Level = zap.NewAtomicLevelAt(defaultLevel)

	logger, err := cfg.Build()
	if err != nil {
		return fmt.Errorf("failed to build zap logger: %w", err)
	}
	Log = logger
	// Optionally log the effective log level
	Log.Info("Logger initialized", zap.String("level", defaultLevel.String()))
	return nil
}
