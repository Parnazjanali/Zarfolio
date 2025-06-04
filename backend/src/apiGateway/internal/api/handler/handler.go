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

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(as *service.AuthService) *AuthHandler {
	if as == nil {
		utils.Log.Fatal("AuthService cannot be nil for AuthHandler. This is a critical dependency.")
	}
	return &AuthHandler{authService: as}
}

// min is a helper function to ensure we don't slice beyond string length
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (h *AuthHandler) RegisterUser(c *fiber.Ctx) error {
	var req model.RegisterRequest


	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse register request body in API Gateway handler", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format.",
			Code:    "400",
		})
	}

	
	if req.Username == "" || req.Password == "" || req.Email == "" {
		utils.Log.Warn("Register attempt: Missing required fields",
			zap.String("username", req.Username),
			zap.String("email", req.Email))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Username, password, and email are required for registration.",
			Code:    "400",
		})
	}
		if !service.IsValidEmail(req.Email) {
		utils.Log.Warn("Register attempt: Invalid email format", zap.String("email", req.Email))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid email format.",
			Code:    "400",
		})
	}

	err := h.authService.RegisterUser(req) 
	if err != nil {
		utils.Log.Error("User registration failed in service layer", zap.String("username", req.Username), zap.Error(err))
		if errors.Is(err, service.ErrUserAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{ 
				Message: "User with this username or email already exists.",
				Code:    "409",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "Registration service is temporarily unavailable. Please try again later.",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during registration.",
			Code:    "500",
		})
	}

	utils.Log.Info("User registered successfully via API Gateway", zap.String("username", req.Username))
	return c.Status(fiber.StatusCreated).JSON(model.AuthResponse{
		Message: "User registered successfully!",
	})
}

func (h *AuthHandler) LoginUser(c *fiber.Ctx) error {
	var req model.LoginRequest

	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse login request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format",
			Code:    "400",
		})
	}
	if req.Username == "" || req.Password == "" {
		utils.Log.Warn("Login attempt with empty credentials", zap.String("username", req.Username))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Username and password are required",
			Code:    "400",
		})
	}

	user, token, err := h.authService.LoginUser(req.Username, req.Password)
	if err != nil {
		utils.Log.Error("Authentication failed in service layer", zap.String("username", req.Username), zap.Error(err))

		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Code:    "401",
				Message: "Invalid username or password",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Code:    "503",
				Message: "Authentication service is temporarily unavailable. Please try again later.",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during authentication",
			Code:    "500",
		})
	}

	utils.Log.Info("User logged in successfully", zap.String("username", user.Username), zap.String("role", user.Role))

	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful",
		Token:   token,
		User:    user,
		Exp:     3600,
	})

}
func (h *AuthHandler) LogoutUser(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		utils.Log.Warn("Logout attempt without Authorization header")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Authorization header is required",
			Code:    "401",
		})
	}
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		utils.Log.Warn("Logout attempt with invalid Authorization header format", zap.String("header", authHeader))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Invalid Authorization header format. Expected 'Bearer <token>'",
			Code:    "401",
		})
	}
	tokenSrting := tokenParts[1]

	err := h.authService.Logout(tokenSrting)
	if err != nil {
		utils.Log.Error("Logout failed in service layer", zap.String("token", tokenSrting), zap.Error(err))
		if errors.Is(err, service.ErrTokenNotFound) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid or expired token",
				Code:    "401",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Code:    "503",
				Message: "Authentication service is temporarily unavailable. Please try again later.",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during logout",
			Code:    "500",
		})
	}

	utils.Log.Info("User logged out successfully", zap.String("token_prefix", tokenSrting[:min(len(tokenSrting), 10)]))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Logout successful",
	})
}

func (h *AuthHandler) HandleRequestPasswordReset(c *fiber.Ctx) error {
	var req model.RequestPasswordResetRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("API Gateway HandleRequestPasswordReset: Failed to parse request", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request format.", Code: "400_INVALID_FORMAT",
		})
	}

	if req.Email == "" { // Basic validation
		utils.Log.Warn("API Gateway HandleRequestPasswordReset: Email field is missing")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Email is required.", Code: "400_EMAIL_REQUIRED",
		})
	}
	// Consider adding email format validation here if not done by a middleware
	// if !service.IsValidEmail(req.Email) { ... }

	err := h.authService.RequestPasswordReset(req)
	if err != nil {
		// Service layer should log specifics. Handler returns generic internal error.
		// The actual success/failure of finding email is hidden from client to prevent enumeration.
		utils.Log.Error("API Gateway HandleRequestPasswordReset: Error calling authService.RequestPasswordReset", zap.String("email", req.Email), zap.Error(err))
		// Even if an internal error occurs, for security, we might still return the generic message.
		// However, for dev/staging, a 500 might be more useful.
		// For now, let's assume any error from authService here IS an internal server error.
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "An internal error occurred. Please try again later.", Code: "500_INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "If your email address exists in our system, you will receive a password reset link shortly.",
	})
}

func (h *AuthHandler) HandleResetPassword(c *fiber.Ctx) error {
	var req model.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("API Gateway HandleResetPassword: Failed to parse request", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request format.", Code: "400_INVALID_FORMAT",
		})
	}

	if req.Token == "" || req.NewPassword == "" { // Basic validation
		utils.Log.Warn("API Gateway HandleResetPassword: Token or NewPassword field is missing")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Token and new password are required.", Code: "400_TOKEN_PASSWORD_REQUIRED",
		})
	}
	// Add password strength validation here if desired, or rely on profileManager's potential validation.

	err := h.authService.PerformPasswordReset(req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) { // Check for specific error from AuthService
			utils.Log.Warn("API Gateway HandleResetPassword: Invalid or expired token provided", zap.Error(err))
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
				Message: "Invalid or expired password reset token. Please request a new one.", Code: "400_INVALID_RESET_TOKEN",
			})
		}
		utils.Log.Error("API Gateway HandleResetPassword: Error calling authService.PerformPasswordReset", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "An internal error occurred while resetting your password. Please try again later.", Code: "500_INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Your password has been successfully reset. You can now log in with your new password.",
	})
}
