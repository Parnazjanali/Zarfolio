package handler

import (
	"errors"
	"gold-api/internal/model"
	"gold-api/internal/service"
	"gold-api/internal/utils"
	"path/filepath" // For filepath.Ext
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// AccountHandlerAG handles account management requests for the API Gateway.
type AccountHandlerAG struct {
	authService *service.AuthService // Reusing AuthService as it contains the methods now
}

// NewAccountHandlerAG creates a new AccountHandlerAG.
func NewAccountHandlerAG(as *service.AuthService) *AccountHandlerAG {
	if as == nil {
		utils.Log.Fatal("AuthService cannot be nil for AccountHandlerAG.")
	}
	return &AccountHandlerAG{authService: as}
}

// getTokenFromContext extracts the JWT from the Authorization header.
func getTokenFromContext(c *fiber.Ctx) string {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.Split(authHeader, " ")
	if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
		return parts[1]
	}
	return ""
}

func (h *AccountHandlerAG) HandleChangeUsername(c *fiber.Ctx) error {
	var req model.ChangeUsernameRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request format.", Code: "400_INVALID_FORMAT"})
	}
	if req.NewUsername == "" || req.CurrentPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "New username and current password are required.", Code: "400_MISSING_FIELDS"})
	}
	if len(req.NewUsername) < 3 {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "New username must be at least 3 characters.", Code: "400_USERNAME_POLICY"})
	}

	userToken := getTokenFromContext(c)
	if userToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing or invalid token.", Code: "401_UNAUTHORIZED"})
	}

	err := h.authService.ChangeUsername(req, userToken)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Incorrect current password.", Code: "401_INVALID_CURRENT_PASSWORD"})
		}
		if errors.Is(err, service.ErrUserAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "New username is already taken.", Code: "409_USERNAME_TAKEN"})
		}
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "User not found.", Code: "404_USER_NOT_FOUND"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "Account service is temporarily unavailable.", Code: "503_SERVICE_UNAVAILABLE"})
		}
		utils.Log.Error("API Gateway HandleChangeUsername: Internal server error", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Error changing username.", Code: "500_INTERNAL_ERROR"})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Username changed successfully."})
}

func (h *AccountHandlerAG) HandleChangePassword(c *fiber.Ctx) error {
	var req model.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request format.", Code: "400_INVALID_FORMAT"})
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Current and new password are required.", Code: "400_MISSING_FIELDS"})
	}
	if len(req.NewPassword) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "New password must be at least 8 characters.", Code: "400_PASSWORD_POLICY"})
	}

	userToken := getTokenFromContext(c)
	if userToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing or invalid token.", Code: "401_UNAUTHORIZED"})
	}

	err := h.authService.ChangePassword(req, userToken)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Incorrect current password.", Code: "401_INVALID_CURRENT_PASSWORD"})
		}
		if errors.Is(err, service.ErrBadRequestFromProfileManager) {
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Password policy violation or bad request.", Code: "400_POLICY_VIOLATION"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "Account service is temporarily unavailable.", Code: "503_SERVICE_UNAVAILABLE"})
		}
		utils.Log.Error("API Gateway HandleChangePassword: Internal server error", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Error changing password.", Code: "500_INTERNAL_ERROR"})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Password changed successfully."})
}

func (h *AccountHandlerAG) HandleGenerateTwoFASetup(c *fiber.Ctx) error {
	userToken := getTokenFromContext(c)
	if userToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing or invalid token.", Code: "401_UNAUTHORIZED"})
	}

	res, err := h.authService.GenerateTwoFASetup(userToken)
	if err != nil {
		if strings.Contains(err.Error(), "2FA is already enabled") { // Check for specific error message string
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "2FA is already enabled for this account.", Code: "409_2FA_ALREADY_ENABLED"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "2FA service is temporarily unavailable.", Code: "503_SERVICE_UNAVAILABLE"})
		}
		utils.Log.Error("API Gateway HandleGenerateTwoFASetup: Internal server error", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to start 2FA setup.", Code: "500_INTERNAL_ERROR"})
	}
	return c.Status(fiber.StatusOK).JSON(res)
}

func (h *AccountHandlerAG) HandleVerifyAndEnableTwoFA(c *fiber.Ctx) error {
	var req model.VerifyTwoFARequestAG
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request format.", Code: "400_INVALID_FORMAT"})
	}
	if req.TOTPCode == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "TOTP code is required.", Code: "400_TOTP_CODE_REQUIRED"})
	}

	userToken := getTokenFromContext(c)
	if userToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing or invalid token.", Code: "401_UNAUTHORIZED"})
	}

	res, err := h.authService.VerifyAndEnableTwoFA(req, userToken)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid TOTP code.", Code: "400_INVALID_TOTP_CODE"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "2FA service is temporarily unavailable.", Code: "503_SERVICE_UNAVAILABLE"})
		}
		utils.Log.Error("API Gateway HandleVerifyAndEnableTwoFA: Internal server error", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to enable 2FA.", Code: "500_INTERNAL_ERROR"})
	}
	return c.Status(fiber.StatusOK).JSON(res)
}

func (h *AccountHandlerAG) HandleDisableTwoFA(c *fiber.Ctx) error {
	var req model.DisableTwoFARequestAG
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request format.", Code: "400_INVALID_FORMAT"})
	}

	// ##### START OF FIX #####
	// از req.Password به جای req.CurrentPassword استفاده شد
	if req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Current password is required.", Code: "400_PASSWORD_REQUIRED"})
	}
	// ##### END OF FIX #####

	userToken := getTokenFromContext(c)
	if userToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing or invalid token.", Code: "401_UNAUTHORIZED"})
	}

	err := h.authService.DisableTwoFA(req, userToken)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) { // Wrong password
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Incorrect current password.", Code: "401_INVALID_CURRENT_PASSWORD"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "2FA service is temporarily unavailable.", Code: "503_SERVICE_UNAVAILABLE"})
		}
		utils.Log.Error("API Gateway HandleDisableTwoFA: Internal server error", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to disable 2FA.", Code: "500_INTERNAL_ERROR"})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "2FA has been successfully disabled."})
}

const maxProfilePictureUploadSize = 2 * 1024 * 1024 // 2MB

func (h *AccountHandlerAG) HandleProfilePictureUpload(c *fiber.Ctx) error {
	userToken := getTokenFromContext(c)
	if userToken == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing or invalid token.", Code: "401_UNAUTHORIZED"})
	}

	fileHeader, err := c.FormFile("profile_picture")
	if err != nil {
		utils.Log.Warn("API Gateway HandleProfilePictureUpload: No file or form error", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Profile picture file is required in 'profile_picture' field.", Code: "400_FILE_REQUIRED"})
	}

	if fileHeader.Size > maxProfilePictureUploadSize {
		utils.Log.Warn("API Gateway HandleProfilePictureUpload: File size exceeds limit", zap.Int64("size", fileHeader.Size))
		return c.Status(fiber.StatusRequestEntityTooLarge).JSON(model.ErrorResponse{Message: "File too large.", Code: "413_FILE_TOO_LARGE"})
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid file type. Allowed: JPG, PNG.", Code: "400_INVALID_FILE_TYPE"})
	}

	newProfilePicURL, err := h.authService.UploadProfilePicture(fileHeader, userToken)
	if err != nil {
		utils.Log.Error("API Gateway HandleProfilePictureUpload: Error calling authService.UploadProfilePicture", zap.Error(err))
		if errors.Is(err, service.ErrFileRejectedByProfileManager) {
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "File rejected by server. Check type or size.", Code: "400_UPLOAD_REJECTED"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "Account service unavailable.", Code: "503_SERVICE_DOWN"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Error uploading profile picture.", Code: "500_UPLOAD_ERROR"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":             "Profile picture uploaded successfully.",
		"profile_picture_url": newProfilePicURL,
	})
}