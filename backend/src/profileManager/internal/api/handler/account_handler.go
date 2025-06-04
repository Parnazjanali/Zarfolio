package handler

import (
	"errors"
	"errors"
	"fmt" // For fmt.Sprintf
	"mime/multipart" // For file uploads
	"os"
	"path/filepath"
	"profile-gold/internal/model"
	"profile-gold/internal/service"
	"profile-gold/internal/utils"
	"strings" // For strings.ToLower and strings.ReplaceAll

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// AccountHandler handles account management related requests.
type AccountHandler struct {
	userService service.UserService
}

// NewAccountHandler creates a new AccountHandler.
func NewAccountHandler(us service.UserService) *AccountHandler {
	if us == nil {
		utils.Log.Fatal("UserService cannot be nil for AccountHandler in Profile Manager.")
	}
	return &AccountHandler{userService: us}
}

// HandleChangeUsername handles requests to change the username.
func (h *AccountHandler) HandleChangeUsername(c *fiber.Ctx) error {
	var req model.ChangeUsernameRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("HandleChangeUsername: Failed to parse request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format.", Code: "400_INVALID_FORMAT",
		})
	}

	// Basic validation (more advanced validation can be done via struct tags and a validator)
	if req.NewUsername == "" || req.CurrentPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "New username and current password are required.", Code: "400_MISSING_FIELDS",
		})
	}
	if len(req.NewUsername) < 3 { // Example validation
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "New username must be at least 3 characters long.", Code: "400_USERNAME_TOO_SHORT",
		})
	}

	// Assume userID is set in locals by an auth middleware
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		utils.Log.Error("HandleChangeUsername: UserID not found in context or is invalid", zap.Any("userID_from_locals", c.Locals("userID")))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Unauthorized: User ID not found in token.", Code: "401_UNAUTHORIZED",
		})
	}

	err := h.userService.ChangeUsername(userID, req.NewUsername, req.CurrentPassword)
	if err != nil {
		utils.Log.Error("HandleChangeUsername: Error calling userService.ChangeUsername", zap.String("userID", userID), zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "User not found.", Code: "404_USER_NOT_FOUND"})
		}
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Incorrect current password.", Code: "401_INVALID_CURRENT_PASSWORD"})
		}
		if errors.Is(err, service.ErrUsernameTaken) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "New username is already taken.", Code: "409_USERNAME_TAKEN"})
		}
		// As per service logic, if username is same, err is nil.
		// So, no specific error string check needed here for that case.
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error while changing username.", Code: "500_INTERNAL_ERROR"})
	}
    // If err is nil and username was same, service returns nil. Client gets success.
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Username change request processed successfully."})
}

// HandleChangePassword handles requests to change the password.
func (h *AccountHandler) HandleChangePassword(c *fiber.Ctx) error {
	var req model.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("HandleChangePassword: Failed to parse request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format.", Code: "400_INVALID_FORMAT",
		})
	}

	// Basic validation
	if req.CurrentPassword == "" || req.NewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Current password and new password are required.", Code: "400_MISSING_FIELDS",
		})
	}
	if len(req.NewPassword) < 8 { // Example validation, should match service layer
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "New password must be at least 8 characters long.", Code: "400_PASSWORD_TOO_SHORT",
		})
	}

	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		utils.Log.Error("HandleChangePassword: UserID not found in context or is invalid")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Unauthorized: User ID not found in token.", Code: "401_UNAUTHORIZED",
		})
	}

	err := h.userService.ChangePassword(userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		utils.Log.Error("HandleChangePassword: Error calling userService.ChangePassword", zap.String("userID", userID), zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "User not found.", Code: "404_USER_NOT_FOUND"})
		}
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Incorrect current password.", Code: "401_INVALID_CURRENT_PASSWORD"})
		}
		// As per service logic, if password is same, err is nil.
		// If password too short from service:
        if err.Error() == "new password must be at least 8 characters long" {
             return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: err.Error(), Code: "400_PASSWORD_POLICY_VIOLATION"})
        }
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error while changing password.", Code: "500_INTERNAL_ERROR"})
	}
    // If err is nil and password was same, service returns nil. Client gets success.
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Password change request processed successfully."})
}

// HandleGenerateTwoFASetup handles requests to generate a new 2FA secret and QR code.
func (h *AccountHandler) HandleGenerateTwoFASetup(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found.", Code: "401_UNAUTHORIZED"})
	}

	rawSecret, qrCodeURL, err := h.userService.GenerateTwoFASetup(userID)
	if err != nil {
		utils.Log.Error("HandleGenerateTwoFASetup: Error calling userService.GenerateTwoFASetup", zap.String("userID", userID), zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "User not found.", Code: "404_USER_NOT_FOUND"})
		}
		if errors.Is(err, service.ErrTwoFAAlreadyEnabled) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "2FA is already enabled for this account.", Code: "409_2FA_ALREADY_ENABLED"})
		}
		if errors.Is(err, service.ErrTwoFASecretGeneration) {
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to generate 2FA secret. Please try again.", Code: "500_2FA_SECRET_GENERATION_FAILED"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error during 2FA setup generation.", Code: "500_INTERNAL_ERROR"})
	}

	return c.Status(fiber.StatusOK).JSON(model.GenerateTwoFAResponse{
		Secret:    rawSecret,
		QRCodeURL: qrCodeURL,
	})
}

// HandleVerifyAndEnableTwoFA handles requests to verify a TOTP code and enable 2FA.
func (h *AccountHandler) HandleVerifyAndEnableTwoFA(c *fiber.Ctx) error {
	var req model.VerifyTwoFARequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request format.", Code: "400_INVALID_FORMAT"})
	}

	if req.TOTPCode == "" { // Basic validation
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "TOTP code is required.", Code: "400_TOTP_CODE_REQUIRED"})
	}
	// Add more validation for TOTP code format (e.g., 6 digits) if needed

	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found.", Code: "401_UNAUTHORIZED"})
	}

	recoveryCodes, err := h.userService.VerifyAndEnableTwoFA(userID, req.TOTPCode)
	if err != nil {
		utils.Log.Error("HandleVerifyAndEnableTwoFA: Error calling userService.VerifyAndEnableTwoFA", zap.String("userID", userID), zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "User not found.", Code: "404_USER_NOT_FOUND"})
		}
		if errors.Is(err, service.ErrTwoFAAlreadyEnabled) { // Should ideally be caught by GenerateTwoFASetup first
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "2FA is already enabled.", Code: "409_2FA_ALREADY_ENABLED"})
		}
		if errors.Is(err, service.ErrTwoFAInvalidCode) {
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid TOTP code. Please check your authenticator app and try again.", Code: "400_INVALID_TOTP_CODE"})
		}
		if errors.Is(err, service.ErrTwoFAEnableFailed) {
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to enable 2FA. Please try again.", Code: "500_2FA_ENABLE_FAILED"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error while enabling 2FA.", Code: "500_INTERNAL_ERROR"})
	}

	return c.Status(fiber.StatusOK).JSON(model.EnableTwoFAResponse{
		RecoveryCodes: recoveryCodes, // IMPORTANT: These are shown to the user ONCE.
	})
}

// HandleDisableTwoFA handles requests to disable 2FA for the user's account.
func (h *AccountHandler) HandleDisableTwoFA(c *fiber.Ctx) error {
	var req model.DisableTwoFARequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request format.", Code: "400_INVALID_FORMAT"})
	}

	if req.CurrentPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Current password is required to disable 2FA.", Code: "400_PASSWORD_REQUIRED"})
	}

	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found.", Code: "401_UNAUTHORIZED"})
	}

	err := h.userService.DisableTwoFA(userID, req.CurrentPassword)
	if err != nil {
		utils.Log.Error("HandleDisableTwoFA: Error calling userService.DisableTwoFA", zap.String("userID", userID), zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "User not found.", Code: "404_USER_NOT_FOUND"})
		}
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Incorrect current password.", Code: "401_INVALID_CURRENT_PASSWORD"})
		}
		if errors.Is(err, service.ErrTwoFANotEnabled) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "2FA is not currently enabled for this account.", Code: "409_2FA_NOT_ENABLED"})
		}
		if errors.Is(err, service.ErrTwoFADisableFailed) {
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to disable 2FA. Please try again.", Code: "500_2FA_DISABLE_FAILED"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error while disabling 2FA.", Code: "500_INTERNAL_ERROR"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "2FA has been successfully disabled."})
}

// Define constants for file upload constraints
const (
	maxUploadSize          = 2 * 1024 * 1024 // 2 MB
	uploadPath             = "./uploads/profile_pictures" // Relative to app execution path
	profilePicturesBaseURL = "/uploads/profile_pictures" // URL base path
)

func (h *AccountHandler) HandleProfilePictureUpload(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found.", Code: "401_UNAUTHORIZED"})
	}

	// Ensure upload directory exists
	if err := os.MkdirAll(uploadPath, os.ModePerm); err != nil {
		utils.Log.Error("HandleProfilePictureUpload: Could not create upload directory", zap.Error(err), zap.String("path", uploadPath))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Server error: Could not prepare for file upload.", Code: "500_UPLOAD_DIR_ERROR"})
	}

	fileHeader, err := c.FormFile("profile_picture") // "profile_picture" is the form field name
	if err != nil {
		if errors.Is(err, multipart.ErrMessageTooLarge) || errors.Is(err, fiber.ErrRequestEntityTooLarge) {
			utils.Log.Warn("HandleProfilePictureUpload: File too large", zap.String("userID", userID), zap.Error(err))
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(model.ErrorResponse{Message: fmt.Sprintf("File too large. Maximum size is %dMB.", maxUploadSize/(1024*1024)), Code: "400_FILE_TOO_LARGE"})
		}
		utils.Log.Warn("HandleProfilePictureUpload: No file uploaded or form field error", zap.String("userID", userID), zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Profile picture file is required.", Code: "400_FILE_REQUIRED"})
	}

	// Validate file size
	if fileHeader.Size > maxUploadSize {
		utils.Log.Warn("HandleProfilePictureUpload: File size exceeds limit", zap.String("userID", userID), zap.Int64("size", fileHeader.Size))
		return c.Status(fiber.StatusRequestEntityTooLarge).JSON(model.ErrorResponse{Message: fmt.Sprintf("File too large. Maximum size is %dMB.", maxUploadSize/(1024*1024)), Code: "400_FILE_TOO_LARGE"})
	}

	// Validate file type (extension and MIME type)
	ext := filepath.Ext(fileHeader.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true}
	if !allowedExts[strings.ToLower(ext)] {
		utils.Log.Warn("HandleProfilePictureUpload: Invalid file type (extension)", zap.String("userID", userID), zap.String("filename", fileHeader.Filename))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid file type. Allowed types: JPG, PNG.", Code: "400_INVALID_FILE_TYPE"})
	}

	// Generate a unique filename
	newFileName := userID + ext
	filePath := filepath.Join(uploadPath, newFileName)

	// Save the file
	if errSave := c.SaveFile(fileHeader, filePath); errSave != nil {
		utils.Log.Error("HandleProfilePictureUpload: Could not save uploaded file", zap.String("userID", userID), zap.Error(errSave))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Server error: Could not save file.", Code: "500_FILE_SAVE_ERROR"})
	}

	// Construct the URL to be stored
	fileURL := filepath.Join(profilePicturesBaseURL, newFileName)
	fileURL = strings.ReplaceAll(fileURL, "\\\\", "/") // Ensure URL uses forward slashes

	// Update user's profilePictureURL in the database
	if errDbUpdate := h.userService.UpdateProfilePictureURL(userID, fileURL); errDbUpdate != nil {
		// If DB update fails, attempt to delete the uploaded file to prevent orphans
		if errRemove := os.Remove(filePath); errRemove != nil {
			utils.Log.Error("HandleProfilePictureUpload: Failed to delete orphaned file after DB error", zap.String("filePath", filePath), zap.Error(errRemove))
		}
		utils.Log.Error("HandleProfilePictureUpload: Failed to update profile picture URL in DB", zap.String("userID", userID), zap.Error(errDbUpdate))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Server error: Could not update profile information.", Code: "500_DB_UPDATE_ERROR"})
	}

	utils.Log.Info("Profile picture uploaded and updated successfully", zap.String("userID", userID), zap.String("fileURL", fileURL))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":             "Profile picture uploaded successfully.",
		"profile_picture_url": fileURL, // Send back the new URL
	})
}
