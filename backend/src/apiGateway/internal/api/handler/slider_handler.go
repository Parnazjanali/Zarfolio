package handler

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// SliderHandler handles slider image uploads.
// It requires a logger for structured logging.
type SliderHandler struct {
	Log *zap.Logger
}

// NewSliderHandler creates a new SliderHandler.
func NewSliderHandler(logger *zap.Logger) (*SliderHandler, error) {
	if logger == nil {
		return nil, fmt.Errorf("logger is nil in NewSliderHandler")
	}
	return &SliderHandler{Log: logger},
	 nil
}

// UploadImage handles the image upload request.
func (h *SliderHandler) UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		h.Log.Error("Failed to get image from form", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Image file is required.",
		})
	}

	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext

	savePath := filepath.Join("..", "..", "..", "frontend", "public", "slider", filename)

	if err := os.MkdirAll(filepath.Dir(savePath), os.ModePerm); err != nil {
		h.Log.Error("Failed to create slider directory", zap.Error(err), zap.String("path", savePath))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create directory on server.",
		})
	}

	if err := c.SaveFile(file, savePath); err != nil {
		h.Log.Error("Failed to save uploaded file", zap.Error(err), zap.String("path", savePath))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file on server.",
		})
	}

	fileURL := "/slider/" + filename

	h.Log.Info("Successfully uploaded slider image", zap.String("url", fileURL))

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "File uploaded successfully",
		"url":     fileURL,
	})
}

// DeleteImageRequest defines the structure for the delete image request body.
type DeleteImageRequest struct {
	Filename string `json:"filename"`
}

// DeleteImage handles the image deletion request.
func (h *SliderHandler) DeleteImage(c *fiber.Ctx) error {
	req := new(DeleteImageRequest)
	if err := c.BodyParser(req); err != nil {
		h.Log.Error("Failed to parse delete image request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Filename == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Filename is required"})
	}

	// Sanitize the filename to prevent directory traversal attacks
	filename := filepath.Base(req.Filename)
	if filename != req.Filename || strings.Contains(filename, "..") {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid filename"})
	}

	imagePath := filepath.Join("..", "..", "..", "frontend", "public", "slider", filename)

	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		h.Log.Warn("Delete request for non-existent file", zap.String("path", imagePath))
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "File not found"})
	}

	if err := os.Remove(imagePath); err != nil {
		h.Log.Error("Failed to delete image file", zap.Error(err), zap.String("path", imagePath))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete file"})
	}

	h.Log.Info("Successfully deleted slider image", zap.String("filename", filename))

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "File deleted successfully"})
}
