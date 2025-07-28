package handler

import (
	"errors"
	"profile-gold/internal/model"
	authService "profile-gold/internal/service/auth"
	service "profile-gold/internal/service/common"
	"profile-gold/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthHandler struct {
	userService authService.AuthService
}

func NewAuthHandler(us authService.AuthService) *AuthHandler {
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

	utils.Log.Info("User logged in successfully in Profile Manager", zap.String("username", user.Username), zap.String("role", string(user.Roles)))

	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful",
		Token:   token,
		User:    user,
		Exp:     claims.ExpiresAt.Unix(),
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		utils.Log.Warn("Profile Manager Handler: Logout attempt: Authorization header missing.", zap.String("ip", c.IP()))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Authorization header required.",
			Code:    "401",
		})
	}

	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || strings.ToLower(tokenParts[0]) != "bearer" {
		utils.Log.Warn("Profile Manager Handler: Logout attempt: Invalid Authorization header format.", zap.String("ip", c.IP()), zap.String("header", authHeader))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Invalid Authorization header format. Expected 'Bearer [token]'.",
			Code:    "401",
		})
	}
	tokenString := tokenParts[1]

	err := h.userService.LogoutUser(tokenString)
	if err != nil {
		utils.Log.Error("Profile Manager Handler: Logout failed in service layer", zap.Error(err), zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]))
		if errors.Is(err, service.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid or expired token.",
				Code:    "401",
			})
		}
		if errors.Is(err, service.ErrInternalService) {
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
				Message: "Internal server error during logout.",
				Code:    "500",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "An unexpected error occurred during logout.",
			Code:    "500",
		})
	}

	utils.Log.Info("Profile Manager Handler: User logged out successfully", zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Logged out successfully!",
	})

}

func (h *AuthHandler) RequestPasswordReset(c *fiber.Ctx) error {
    var req model.RequestPasswordReset
    if err := c.BodyParser(&req); err != nil {
        utils.Log.Error("Profile Manager Handler: Failed to parse request password reset body", zap.Error(err))
        return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
            Message: "Invalid request body format.",
            Code:    "400",
        })
    }
    if req.Email == "" {
        utils.Log.Warn("Profile Manager Handler: Password reset request: Missing email.")
        return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
            Message: "Email is required for password reset.",
            Code:    "400",
        })
    }

    err := h.userService.RequestPasswordReset(req.Email) 
    if err != nil {
        utils.Log.Error("Profile Manager Handler: Failed to request password reset in service layer", zap.String("email", req.Email), zap.Error(err))
        if errors.Is(err, service.ErrUserNotFound) {
            utils.Log.Warn("Profile Manager Handler: Password reset requested for non-existent user, but returning success for security.", zap.String("email", req.Email))
            return c.Status(fiber.StatusOK).JSON(model.AuthResponse{Message: "اگر ایمیل شما در سیستم ثبت شده باشد، دستورالعمل بازنشانی رمز عبور برای شما ارسال خواهد شد."})
        }
        return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error during password reset request.", Code: "500"})
    }

    utils.Log.Info("Profile Manager Handler: Password reset request successfully initiated", zap.String("email", req.Email))
    return c.Status(fiber.StatusOK).JSON(model.AuthResponse{Message: "اگر ایمیل شما در سیستم ثبت شده باشد، دستورالعمل بازنشانی رمز عبور برای شما ارسال خواهد شد."})
}

func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	utils.Log.Info("ResetPassword endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Reset Password endpoint hit (placeholder)"})
}

func (h *AuthHandler) VerifyTwoFA(c *fiber.Ctx) error {
	utils.Log.Info("VerifyTwoFA endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Verify Two-Factor Authentication endpoint hit (placeholder)"})
}
