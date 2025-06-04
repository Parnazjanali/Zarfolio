package handler

import (
	"errors"
	"gold-api/internal/model"
	"gold-api/internal/service"
	"gold-api/internal/utils"
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
// This is a helper, actual middleware might put the token string directly in locals.
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
	// Basic validation (could be enhanced with a library)
	if req.NewUsername == "" || req.CurrentPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "New username and current password are required.", Code: "400_MISSING_FIELDS"})
	}
	if len(req.NewUsername) < 3 {
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "New username must be at least 3 characters.", Code: "400_USERNAME_POLICY"})
	}

	userToken := getTokenFromContext(c) // Helper to get token string
	if userToken == "" {
		// This case should ideally be caught by the AuthUser middleware first.
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing or invalid token.", Code: "401_UNAUTHORIZED"})
	}
	// userID from c.Locals("userID") can be used for logging if needed, but service call needs the token.
	// userID := c.Locals("userID").(string)
	// utils.Log.Debug("HandleChangeUsername in apiGateway", zap.String("userID_from_claims", userID))

	err := h.authService.ChangeUsername(req, userToken)
	if err != nil {
		// Translate errors from service/client layer to HTTP responses
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Incorrect current password.", Code: "401_INVALID_CURRENT_PASSWORD"})
		}
		if errors.Is(err, service.ErrUserAlreadyExists) { // Username taken
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "New username is already taken.", Code: "409_USERNAME_TAKEN"})
		}
		if errors.Is(err, service.ErrUserNotFound) { // Should not happen if token is valid
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
		if errors.Is(err, service.ErrInvalidCredentials) { // Incorrect current password
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Incorrect current password.", Code: "401_INVALID_CURRENT_PASSWORD"})
		}
		// Check for specific Bad Request from profile manager (e.g. password policy)
		// The client might wrap this in a generic error, or pass it through.
		// For now, other errors are treated as internal or service down.
		if strings.Contains(err.Error(), "bad request from profile manager") { // Example of checking wrapped error string
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
