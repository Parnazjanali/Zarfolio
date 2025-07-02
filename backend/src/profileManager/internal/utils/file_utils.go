package utils

import (
	"os"

	"go.uber.org/zap"
)

// EnsureDir checks if a directory exists, and if not, creates it.
func EnsureDir(dirName string) error {
	err := os.MkdirAll(dirName, os.ModePerm)
	if err != nil {
		Log.Error("EnsureDir: Failed to create directory", zap.String("directory", dirName), zap.Error(err))
		return err
	}
	Log.Debug("EnsureDir: Directory ensured", zap.String("directory", dirName))
	return nil
}
