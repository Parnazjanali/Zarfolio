package utils

import "go.uber.org/zap"
var Log *zap.Logger

func InitLogger()error{
	var err error
	Log, err =zap.NewProduction()
	return err


}