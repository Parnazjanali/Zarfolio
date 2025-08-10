package handler

import (
	"errors"
	"fmt"
	"gold-api/internal/model"
	"gold-api/internal/service/auth"
	service "gold-api/internal/service/common"
	"gold-api/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthHandler struct {
	authService auth.AuthService
	logger      *zap.Logger
}

func NewAuthHandler(authSvc auth.AuthService, logger *zap.Logger) (*AuthHandler, error) {
	defer logger.Sync() // اطمینان از flush شدن لاگ‌ها

	if authSvc == nil {
		logger.Error("AuthService is nil when passed to NewAuthHandler",
			zap.String("service", "api-gateway"),
			zap.String("operation", "new-auth-handler"))
		return nil, fmt.Errorf("AuthService cannot be nil for AuthHandler")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for AuthHandler")
	}

	logger.Debug("AuthHandler initialized successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "new-auth-handler"))
	return &AuthHandler{authService: authSvc, logger: logger}, nil
}

func (h *AuthHandler) RegisterUser(c *fiber.Ctx) error {
	defer h.logger.Sync()

	var req model.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse register request body",
			zap.String("service", "api-gateway"),
			zap.String("operation", "register-user"),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format",
			Code:    "400",
		})
	}

	if req.Username == "" || req.Password == "" || req.Email == "" {
		h.logger.Warn("Register attempt: Missing required fields",
			zap.String("service", "api-gateway"),
			zap.String("operation", "register-user"),
			zap.String("username", req.Username),
			zap.String("email", req.Email))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Username, password, and email are required for registration",
			Code:    "400",
		})
	}

	err := h.authService.RegisterUser(req)
	if err != nil {
		h.logger.Error("User registration failed in service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "register-user"),
			zap.String("username", req.Username),
			zap.Error(err))
		if errors.Is(err, service.ErrUserAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{
				Message: "User with this username or email already exists",
				Code:    "409",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "Registration service is temporarily unavailable. Please try again later",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during registration",
			Code:    "500",
		})
	}

	h.logger.Debug("User registered successfully via API Gateway",
		zap.String("service", "api-gateway"),
		zap.String("operation", "register-user"),
		zap.String("username", req.Username))
	return c.Status(fiber.StatusCreated).JSON(model.AuthResponse{
		Message: "User registered successfully!",
	})
}

func (h *AuthHandler) LoginUser(c *fiber.Ctx) error {
	defer h.logger.Sync()

	var req model.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse login request body",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-user"),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format",
			Code:    "400",
		})
	}

	if req.Username == "" || req.Password == "" {
		h.logger.Warn("Login attempt with empty credentials",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-user"),
			zap.String("username", req.Username))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Username and password are required",
			Code:    "400",
		})
	}

	user, token, claims, err := h.authService.LoginUser(req.Username, req.Password)
	if err != nil {
		h.logger.Error("Authentication failed in service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-user"),
			zap.String("username", req.Username),
			zap.Error(err))
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Code:    "401",
				Message: "Invalid username or password",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Code:    "503",
				Message: "Authentication service is temporarily unavailable. Please try again later",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during authentication",
			Code:    "500",
		})
	}

	if claims == nil {
		h.logger.Error("Claims are nil after successful login",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-user"),
			zap.String("username", req.Username))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error: invalid claims",
			Code:    "500",
		})
	}

	c.Locals("userID", claims.UserID)
	c.Locals("username", claims.Username)
	c.Locals("userRoles", claims.Roles)

	var exp int64
	if claims.ExpiresAt != nil {
		exp = claims.ExpiresAt.Unix()
	} else {
		h.logger.Warn("JWT token returned without an 'exp' claim",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-user"),
			zap.String("username", user.Username))
		exp = 0
	}

	h.logger.Debug("User logged in successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "login-user"),
		zap.String("username", user.Username),
		zap.Any("roles", user.Roles))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful",
		Token:   token,
		User:    user,
		Exp:     exp,
	})
}

func (h *AuthHandler) LogoutUser(c *fiber.Ctx) error {
	defer h.logger.Sync()

	authHeader := c.Get("Authorization")
	if authHeader == "" {
		h.logger.Warn("Logout attempt without Authorization header",
			zap.String("service", "api-gateway"),
			zap.String("operation", "logout-user"))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Authorization header is required",
			Code:    "401",
		})
	}

	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		h.logger.Warn("Logout attempt with invalid Authorization header format",
			zap.String("service", "api-gateway"),
			zap.String("operation", "logout-user"),
			zap.String("header", authHeader))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Invalid Authorization header format. Expected 'Bearer <token>'",
			Code:    "401",
		})
	}
	tokenString := tokenParts[1]

	err := h.authService.LogoutUser(tokenString)
	if err != nil {
		h.logger.Error("Logout failed in service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "logout-user"),
			zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]),
			zap.Error(err))
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid or expired token",
				Code:    "401",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Code:    "503",
				Message: "Authentication service is temporarily unavailable. Please try again later",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during logout",
			Code:    "500",
		})
	}

	h.logger.Debug("User logged out successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "logout-user"),
		zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Logout successful",
	})
}

func (h *AuthHandler) HandleRequestPasswordReset(c *fiber.Ctx) error {
	defer h.logger.Sync()

	var req model.RequestPasswordReset
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse request password reset body",
			zap.String("service", "api-gateway"),
			zap.String("operation", "request-password-reset"),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format",
			Code:    "400",
		})
	}

	if req.Email == "" {
		h.logger.Warn("Password reset request: Missing email",
			zap.String("service", "api-gateway"),
			zap.String("operation", "request-password-reset"))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Email is required for password reset",
			Code:    "400",
		})
	}

	err := h.authService.RequestPasswordReset(req.Email)
	if err != nil {
		h.logger.Error("Failed to request password reset in service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "request-password-reset"),
			zap.String("email", req.Email),
			zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{
				Message: "User not found",
				Code:    "404",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "Service temporarily unavailable",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error",
			Code:    "500",
		})
	}

	h.logger.Debug("Password reset request successfully initiated",
		zap.String("service", "api-gateway"),
		zap.String("operation", "request-password-reset"),
		zap.String("email", req.Email))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Password reset instructions sent to your email",
	})
}

func (h *AuthHandler) HandleResetPassword(c *fiber.Ctx) error {
	defer h.logger.Sync()

	var req model.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse reset password body",
			zap.String("service", "api-gateway"),
			zap.String("operation", "reset-password"),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format",
			Code:    "400",
		})
	}

	if req.Token == "" || req.NewPassword == "" {
		h.logger.Warn("Password reset: Missing token or new password",
			zap.String("service", "api-gateway"),
			zap.String("operation", "reset-password"))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Reset token and new password are required",
			Code:    "400",
		})
	}

	err := h.authService.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		h.logger.Error("Failed to reset password in service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "reset-password"),
			zap.String("token_prefix", req.Token[:utils.Min(len(req.Token), 10)]),
			zap.Error(err))
		if errors.Is(err, service.ErrInvalidToken) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid or expired reset token",
				Code:    "401",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "Service temporarily unavailable",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error",
			Code:    "500",
		})
	}

	h.logger.Debug("Password reset successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "reset-password"),
		zap.String("token_prefix", req.Token[:utils.Min(len(req.Token), 10)]))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Password has been reset successfully",
	})
}

func (h *AuthHandler) HandleLoginTwoFA(c *fiber.Ctx) error {
	defer h.logger.Sync()

	var req model.VerifyTwoFARequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse 2FA verification request body",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-twofa"),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format",
			Code:    "400",
		})
	}

	if req.Code == "" {
		h.logger.Warn("2FA verification attempt: Missing code",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-twofa"))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "2FA code is required",
			Code:    "400",
		})
	}

	username, ok := c.Locals("username").(string)
	if !ok || username == "" {
		h.logger.Error("Username not found in context for 2FA verification",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-twofa"))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Username not found in request context",
			Code:    "401",
		})
	}

	user, token, claims, err := h.authService.VerifyTwoFACode(username, req.Code)
	if err != nil {
		h.logger.Error("2FA login failed in service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-twofa"),
			zap.String("username", username),
			zap.Error(err))
		if errors.Is(err, service.ErrInvalidTwoFACode) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid 2FA code",
				Code:    "401",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "Service temporarily unavailable",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during 2FA login",
			Code:    "500",
		})
	}

	if claims == nil {
		h.logger.Error("Claims are nil after successful 2FA login",
			zap.String("service", "api-gateway"),
			zap.String("operation", "login-twofa"),
			zap.String("username", username))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error: invalid claims",
			Code:    "500",
		})
	}

	c.Locals("userID", claims.UserID)
	c.Locals("username", claims.Username)
	c.Locals("userRoles", claims.Roles)

	h.logger.Debug("User logged in successfully with 2FA",
		zap.String("service", "api-gateway"),
		zap.String("operation", "login-twofa"),
		zap.String("username", user.Username))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful with 2FA",
		Token:   token,
		User:    user,
		Exp:     claims.ExpiresAt.Unix(),
	})
}
