package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
)

func SetUpSliderRoutes(apiGroup fiber.Router, sliderHandler *handler.SliderHandler, authMiddleware *middleware.AuthMiddleware) error {
	if sliderHandler == nil {
		return fmt.Errorf("SliderHandler is nil in SetUpSliderRoutes")
	}
	if authMiddleware == nil {
		return fmt.Errorf("AuthMiddleware is nil in SetUpSliderRoutes")
	}

	sliderGroup := apiGroup.Group("/slider")
	utils.Log.Info("Configuring /api/v1/slider routes.")

	// Apply auth middleware to protect the endpoints
	sliderGroup.Post("/upload", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), sliderHandler.UploadImage)
	sliderGroup.Delete("/image", authMiddleware.AuthorizeMiddleware(model.PermUserUpdate), sliderHandler.DeleteImage)

	utils.Log.Info("Slider routes configured.")
	return nil
}
