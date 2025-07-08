package handler

import (
	"errors"
	"gold-api/internal/model"
	"gold-api/internal/service/auth"
	service "gold-api/internal/service/common"
	"gold-api/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthHandler struct {
	authService *auth.AuthService
}

func NewAuthHandler(authService *auth.AuthService) *AuthHandler {
	return &AuthHandler{
		// ...initialize fields...
	}
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

	user, token, claims, err := h.authService.LoginUser(req.Username, req.Password)
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

	c.Locals("userID", claims.UserID)
	c.Locals("username", claims.Username)
	c.Locals("userRoles", claims.Roles) 

	utils.Log.Info("User logged in successfully",
		zap.String("username", user.Username),
		zap.Any("roles", user.Roles), 
	)

	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful",
		Token:   token,
		User:    user,                    
		Exp:     claims.ExpiresAt.Unix(), 
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
	tokenString := tokenParts[1]

	err := h.authService.LogoutUser(tokenString)
	if err != nil {
		utils.Log.Error("Logout failed in service layer", zap.String("token", tokenString), zap.Error(err))
		if errors.Is(err, service.ErrInvalidCredentials) { // Use ErrInvalidCredentials for invalid/expired token
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

	utils.Log.Info("User logged out successfully", zap.String("token_prefix", tokenString[:min(len(tokenString), 10)]))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Logout successful",
	})
}

func (h *AuthHandler) HandleRequestPasswordReset(c *fiber.Ctx) error {

	var req model.RequestPasswordReset

	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse request password reset body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format.",
			Code:    "400",
		})
	}
	if req.Email == "" {
		utils.Log.Warn("Password reset request: Missing email.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Email is required for password reset.",
			Code:    "400",
		})
	}

	err := h.authService.RequestPasswordReset(req.Email) // Call service layer
	if err != nil {
		utils.Log.Error("Failed to request password reset in service layer", zap.String("email", req.Email), zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "User not found.", Code: "404"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "Service temporarily unavailable.", Code: "503"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error.", Code: "500"})
	}

	utils.Log.Info("Password reset request successfully initiated", zap.String("email", req.Email))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{Message: "Password reset instructions sent to your email."})
}

func (h *AuthHandler) HandleResetPassword(c *fiber.Ctx) error {
	var req model.ResetPasswordRequest // Assume you have this model
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse reset password body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format.",
			Code:    "400",
		})
	}
	if req.Token == "" || req.NewPassword == "" {
		utils.Log.Warn("Password reset: Missing token or new password.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Reset token and new password are required.",
			Code:    "400",
		})
	}

	err := h.authService.ResetPassword(req.Token, req.NewPassword) // Call service layer
	if err != nil {
		utils.Log.Error("Failed to reset password in service layer", zap.String("token_prefix", req.Token[:min(len(req.Token), 10)]), zap.Error(err))
		if errors.Is(err, service.ErrInvalidToken) { // Assume ErrInvalidToken for invalid/expired reset tokens
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Invalid or expired reset token.", Code: "401"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "Service temporarily unavailable.", Code: "503"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error.", Code: "500"})
	}

	utils.Log.Info("Password reset successfully.")
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{Message: "Password has been reset successfully."})
}

func (h *AuthHandler) HandleLoginTwoFA(c *fiber.Ctx) error {
	var req model.VerifyTwoFARequest // Reusing VerifyTwoFARequest from model
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse 2FA verification request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format.",
			Code:    "400",
		})
	}
	if req.Code == "" {
		utils.Log.Warn("2FA verification attempt: Missing code.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "2FA code is required.",
			Code:    "400",
		})
	}

	// You'll need to pass the user's temporary session/userID which should be stored
	// in c.Locals or a session mechanism after the first login step.
	// For simplicity here, let's assume `username` is still available or derived from context.
	// In a real 2FA flow, after successful username/password, the server might return a temporary token,
	// which the client sends back with the 2FA code.
	username := c.Locals("username").(string) // Example: getting username from context

	user, token, claims, err := h.authService.LoginTwoFA(username, req.Code) // Call service layer for 2FA login
	if err != nil {
		utils.Log.Error("2FA login failed in service layer", zap.String("username", username), zap.Error(err))
		if errors.Is(err, service.ErrInvalidTwoFACode) { // Assume ErrInvalidTwoFACode
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Invalid 2FA code.", Code: "401"})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "Service temporarily unavailable.", Code: "503"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error during 2FA login.", Code: "500"})
	}

	// Update session/context with full login details after 2FA success
	c.Locals("userID", claims.UserID)
	c.Locals("username", claims.Username)
	c.Locals("userRoles", claims.Roles)

	utils.Log.Info("User logged in successfully with 2FA", zap.String("username", user.Username))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful with 2FA",
		Token:   token,
		User:    user,
		Exp:     claims.ExpiresAt.Unix(),
	})
}

// ... (min func)

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
