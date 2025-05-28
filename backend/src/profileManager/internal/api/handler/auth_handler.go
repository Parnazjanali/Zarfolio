package handler

import (
	"errors"
	"fmt"
	"profile-gold/internal/model"
	"profile-gold/internal/service"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthHandler struct {
	userService service.UserService
}
type ProfileHandler struct {
	userService service.UserService 
}

func NewAuthHandler(us service.UserService) *AuthHandler {
	if us == nil {
		utils.Log.Fatal("UserService cannot be nil for AuthHandler in Profile Manager.")
	}
	return &AuthHandler{userService: us}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req model.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse register request body in Profile Manager handler", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format",
			Code:    "400",
		})
	}

	if req.Username == "" || req.Password == "" || req.Email == "" {
		utils.Log.Warn("Register attempt with empty fields in Profile Manager handler",
			zap.String("username", req.Username), zap.String("email", req.Email))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Username, password, and email are required.",
			Code:    "400",
		})
	}

	err := h.userService.RegisterUser(req)
	if err != nil {
		utils.Log.Error("User registration failed in Profile Manager service", zap.String("username", req.Username), zap.Error(err))
		if errors.Is(err, service.ErrUserAlreadyExists) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{
				Message: "User with this username or email already exists.",
				Code:    "409",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during registration.",
			Code:    "500",
		})
	}

	utils.Log.Info("User registered successfully in Profile Manager", zap.String("username", req.Username))
	return c.Status(fiber.StatusCreated).JSON(model.AuthResponse{
		Message: "User registered successfully!",
	})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req model.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse login request body in Profile Manager handler", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format",
			Code:    "400",
		})
	}

	if req.Username == "" || req.Password == "" {
		utils.Log.Warn("Login attempt with empty credentials in Profile Manager handler", zap.String("username", req.Username))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Username and password are required",
			Code:    "400",
		})
	}

	user, token, claims, err := h.userService.AuthenticateUser(req.Username, req.Password) 
	if err != nil {
		utils.Log.Error("User authentication failed in Profile Manager service", zap.String("username", req.Username), zap.Error(err))

		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Code:    "401",
				Message: "Invalid username or password",
			})
		}
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Code:    "401",
				Message: "Invalid username or password",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during authentication",
			Code:    "500",
		})
	}

	utils.Log.Info("User logged in successfully in Profile Manager", zap.String("username", user.Username), zap.String("role", user.Role))

	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful",
		Token:   token,
		User:    user,
		Exp:     claims.ExpiresAt.Unix(), 
	})
}
func (h *ProfileHandler) CreateProfile(c *fiber.Ctx) error {
	utils.Log.Info("CreateProfile endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Create Profile endpoint hit (placeholder)"})
}

func (h *ProfileHandler) GetProfile(c *fiber.Ctx) error {
	profileID := c.Params("id")
	utils.Log.Info("GetProfile endpoint hit. Placeholder.", zap.String("id", profileID), zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": fmt.Sprintf("Get Profile %s endpoint hit (placeholder)", profileID)})
}

func (h *ProfileHandler) UpdateProfile(c *fiber.Ctx) error {
	profileID := c.Params("id")
	utils.Log.Info("UpdateProfile endpoint hit. Placeholder.", zap.String("id", profileID), zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": fmt.Sprintf("Update Profile %s endpoint hit (placeholder)", profileID)})
}

func (h *ProfileHandler) DeleteProfile(c *fiber.Ctx) error {
	profileID := c.Params("id")
	utils.Log.Info("DeleteProfile endpoint hit. Placeholder.", zap.String("id", profileID), zap.String("ip", c.IP()))
	return c.Status(fiber.StatusNoContent).SendString("") 
}
