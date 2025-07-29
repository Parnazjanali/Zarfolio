// internal/utils/logger.go
package utils

import (
	"fmt"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Log *zap.Logger // این الان nil است تا زمانی که مقداردهی اولیه شود

func InitLogger() {
	// این تابع برای مقداردهی اولیه Log استفاده می شود
	config := zap.NewProductionConfig()
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder // فرمت زمان استاندارد ISO 8601
	config.EncoderConfig.TimeKey = "ts"                          // نام فیلد زمان
	config.EncoderConfig.LevelKey = "level"                      // نام فیلد سطح لاگ
	config.EncoderConfig.CallerKey = "caller"                    // نام فیلد کالر

	// اگر در محیط توسعه هستید و می خواهید لاگ های قابل خواندن تری داشته باشید:
	// config = zap.NewDevelopmentConfig()
	// config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder

	var err error
	Log, err = config.Build()
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err)) // اگر لاگر نتواند ساخته شود، panic کند
	}
	Log.Info("Logger initialized successfully!")
}
