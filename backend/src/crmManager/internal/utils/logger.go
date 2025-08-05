package utils

import (
	"fmt"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Log *zap.Logger 

func InitLogger() error{

	config := zap.NewProductionConfig()
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder 
	config.EncoderConfig.TimeKey = "ts"                         
	config.EncoderConfig.LevelKey = "level"                     
	config.EncoderConfig.CallerKey = "caller"                   

	config = zap.NewDevelopmentConfig()
	config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder

	var err error
	Log, err = config.Build()
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize logger: %v", err)) 
	}
	Log.Info("Logger initialized successfully!")

	return nil
}
