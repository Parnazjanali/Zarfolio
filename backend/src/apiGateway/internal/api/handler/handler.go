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
