package handler

import (
	"bytes"   // اضافه شد
	"errors"
	"fmt"      // اضافه شد
	"net/http" // اضافه شد
	"os"       // اضافه شد
	"time"     // اضافه شد
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
	if errParser := c.BodyParser(&req); errParser != nil {
		utils.Log.Error("API Gateway LoginUser: Failed to parse request", zap.Error(errParser))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request format.", Code: "400_INVALID_FORMAT",
		})
	}
	if req.Username == "" || req.Password == "" {
		utils.Log.Warn("API Gateway LoginUser: Missing credentials")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Username and password are required.", Code: "400_MISSING_CREDENTIALS",
		})
	}

	// Call the updated AuthService.LoginUser
	user, token, exp, _, userIDFor2FA, err := h.authService.LoginUser(req.Username, req.Password) // twoFARequired removed

	if err != nil {
		// Check for ErrTwoFARequiredAG first, as it's not a "hard" error for this step
		if errors.Is(err, service.ErrTwoFARequiredAG) { // Assuming ErrTwoFARequiredAG is the specific error from AuthService
			utils.Log.Info("API Gateway LoginUser: 2FA required", zap.String("userID", userIDFor2FA))
			return c.Status(fiber.StatusOK).JSON(model.LoginStep1ResponseAG{ // Use the AG specific model
				TwoFARequired: true, // This field signals to the client that 2FA is required
				UserID:        userIDFor2FA,
				Message:       "2FA code required. Please submit your TOTP code.",
			})
		}
		if errors.Is(err, service.ErrInvalidCredentials) || errors.Is(err, service.ErrUserNotFound) {
			utils.Log.Warn("API Gateway LoginUser: Invalid credentials or user not found", zap.String("username", req.Username), zap.Error(err))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Code: "401_INVALID_CREDENTIALS", Message: "Invalid username or password.",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			utils.Log.Error("API Gateway LoginUser: Profile manager down", zap.String("username", req.Username), zap.Error(err))
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Code: "503_SERVICE_UNAVAILABLE", Message: "Authentication service is temporarily unavailable.",
			})
		}
		// For other errors from authService (already logged there)
		utils.Log.Error("API Gateway LoginUser: Internal error during authentication", zap.String("username", req.Username), zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during authentication.", Code: "500_INTERNAL_ERROR",
		})
	}

	// This part is reached if 2FA was not required and login was successful
	utils.Log.Info("API Gateway LoginUser: User logged in successfully", zap.String("username", user.Username))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful",
		Token:   token,
		User:    user,
		Exp:     exp,
	})
}

func (h *AuthHandler) HandleLoginTwoFA(c *fiber.Ctx) error {
	var req model.LoginTwoFARequestAG // Use AG specific model
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("API Gateway HandleLoginTwoFA: Failed to parse request", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request format.", Code: "400_INVALID_FORMAT",
		})
	}

	if req.UserID == "" || req.TOTPCode == "" {
		utils.Log.Warn("API Gateway HandleLoginTwoFA: UserID or TOTPCode missing")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "UserID and TOTP code are required.", Code: "400_MISSING_FIELDS",
		})
	}

	user, token, exp, err := h.authService.LoginTwoFA(req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) { // Covers invalid TOTP code
			utils.Log.Warn("API Gateway HandleLoginTwoFA: Invalid TOTP code or user issue", zap.String("userID", req.UserID), zap.Error(err))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid 2FA code or user session.", Code: "401_INVALID_2FA_CODE",
			})
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			utils.Log.Error("API Gateway HandleLoginTwoFA: Profile manager down", zap.String("userID", req.UserID), zap.Error(err))
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Code: "503_SERVICE_UNAVAILABLE", Message: "Authentication service is temporarily unavailable.",
			})
		}
		utils.Log.Error("API Gateway HandleLoginTwoFA: Internal error during 2FA login", zap.String("userID", req.UserID), zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during 2FA login.", Code: "500_INTERNAL_ERROR",
		})
	}

	utils.Log.Info("API Gateway HandleLoginTwoFA: User successfully logged in with 2FA", zap.String("userID", req.UserID))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful with 2FA.",
		Token:   token,
		User:    user,
		Exp:     exp,
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

// --- تابع جدید پراکسی برای تنظیمات ---
// ProxyToSettings forwards requests to the SettingsManager service
func (h *AuthHandler) ProxyToSettings(c *fiber.Ctx) error {
	settingsManagerURL := os.Getenv("SETTINGS_MANAGER_BASE_URL")
	if settingsManagerURL == "" {
		utils.Log.Error("SETTINGS_MANAGER_BASE_URL not set in env")
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Settings service is not configured.",
			Code:    "500_SETTINGS_SERVICE_UNCONFIGURED",
		})
	}

	// مسیر در سرویس SettingsManager /api/settings است
	targetURL := fmt.Sprintf("%s/api/settings", settingsManagerURL)

	proxyReq, err := http.NewRequest(c.Method(), targetURL, bytes.NewReader(c.Body()))
	if err != nil {
		utils.Log.Error("Failed to create proxy request to settings service", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Error creating request to settings service.",
			Code:    "500_PROXY_REQ_ERROR",
		})
	}

	// کپی کردن هدرها
	proxyReq.Header = c.GetReqHeaders()
	// حذف هدر Authorization چون ارتباط بین سرویس‌ها داخلی و امن فرض می‌شود
	// اگر نیاز به احراز هویت بین سرویسی دارید، این خط را حذف کنید.
	proxyReq.Header.Del("Authorization")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(proxyReq)
	if err != nil {
		utils.Log.Error("Failed to execute proxy request to settings service", zap.Error(err))
		return c.Status(fiber.StatusBadGateway).JSON(model.ErrorResponse{
			Message: "Settings service is unreachable.",
			Code:    "502_SETTINGS_SERVICE_UNREACHABLE",
		})
	}
	defer resp.Body.Close()

	// کپی کردن پاسخ از سرویس تنظیمات به کلاینت اصلی
	c.Status(resp.StatusCode)
	for key, values := range resp.Header {
		for _, value := range values {
			c.Set(key, value)
		}
	}

	return c.SendStream(resp.Body)
}

// ProxyListUsersToProfileManager forwards GET /api/v1/users to profileManager's /api/v1/admin/users
func (h *AuthHandler) ProxyListUsersToProfileManager(c *fiber.Ctx) error {
	profileManagerURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerURL == "" {
		utils.Log.Error("PROFILE_MANAGER_BASE_URL not set in env for ProxyListUsersToProfileManager")
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "User management service is not configured.",
			Code:    "500_USER_SERVICE_UNCONFIGURED",
		})
	}

	targetURL := fmt.Sprintf("%s/api/v1/admin/users", profileManagerURL)

	// Get the original token from context (set by AuthUser middleware)
	userToken := c.Locals("userToken")
	if userToken == nil || userToken.(string) == "" {
		utils.Log.Warn("ProxyListUsersToProfileManager: User token not found in context. This should not happen if AuthUser middleware is applied.")
		// This case should ideally be caught by AuthUser middleware itself.
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing token for proxy."})
	}


	proxyReq, err := http.NewRequest(http.MethodGet, targetURL, nil) // GET request, no body
	if err != nil {
		utils.Log.Error("Failed to create proxy request to profileManager (ListUsers)", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Error creating request to user management service.",
			Code:    "500_PROXY_REQ_ERROR_USERS_LIST",
		})
	}

	// Forward the original Authorization header
	proxyReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", userToken.(string)))
	// Copy other relevant headers if necessary, e.g., Content-Type if it were a POST/PUT
	// For GET, Authorization is usually the main one.

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(proxyReq)
	if err != nil {
		utils.Log.Error("Failed to execute proxy request to profileManager (ListUsers)", zap.Error(err), zap.String("targetURL", targetURL))
		return c.Status(fiber.StatusBadGateway).JSON(model.ErrorResponse{
			Message: "User management service is unreachable.",
			Code:    "502_USER_SERVICE_UNREACHABLE_LIST",
		})
	}
	defer resp.Body.Close()

	c.Status(resp.StatusCode)
	for key, values := range resp.Header {
		for _, value := range values {
			// Forward relevant headers from the profileManager response
			if key == "Content-Type" || key == "Content-Length" { // Add more if needed
				c.Set(key, value)
			}
		}
	}
	return c.SendStream(resp.Body)
}

// ProxyUpdateUserRoleToProfileManager forwards PUT /api/v1/users/:userId/role to profileManager's /api/v1/admin/users/:userId/role
func (h *AuthHandler) ProxyUpdateUserRoleToProfileManager(c *fiber.Ctx) error {
	profileManagerURL := os.Getenv("PROFILE_MANAGER_BASE_URL")
	if profileManagerURL == "" {
		utils.Log.Error("PROFILE_MANAGER_BASE_URL not set in env for ProxyUpdateUserRoleToProfileManager")
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "User management service is not configured.",
			Code:    "500_USER_SERVICE_UNCONFIGURED_ROLE",
		})
	}

	userID := c.Params("userId")
	if userID == "" {
		utils.Log.Warn("ProxyUpdateUserRoleToProfileManager: User ID missing from path params")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "User ID is required in path."})
	}

	targetURL := fmt.Sprintf("%s/api/v1/admin/users/%s/role", profileManagerURL, userID)

	userToken := c.Locals("userToken")
	if userToken == nil || userToken.(string) == "" {
		utils.Log.Warn("ProxyUpdateUserRoleToProfileManager: User token not found in context.")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: Missing token for proxy."})
	}

	proxyReq, err := http.NewRequest(http.MethodPut, targetURL, bytes.NewReader(c.Body())) // PUT request with body
	if err != nil {
		utils.Log.Error("Failed to create proxy request to profileManager (UpdateUserRole)", zap.String("userID", userID), zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Error creating request to user management service.",
			Code:    "500_PROXY_REQ_ERROR_USER_ROLE",
		})
	}

	proxyReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", userToken.(string)))
	proxyReq.Header.Set("Content-Type", c.Get("Content-Type")) // Forward original Content-Type
	// Copy other relevant headers if necessary

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(proxyReq)
	if err != nil {
		utils.Log.Error("Failed to execute proxy request to profileManager (UpdateUserRole)", zap.String("userID", userID), zap.Error(err), zap.String("targetURL", targetURL))
		return c.Status(fiber.StatusBadGateway).JSON(model.ErrorResponse{
			Message: "User management service is unreachable.",
			Code:    "502_USER_SERVICE_UNREACHABLE_ROLE",
		})
	}
	defer resp.Body.Close()

	c.Status(resp.StatusCode)
	for key, values := range resp.Header {
		for _, value := range values {
			if key == "Content-Type" || key == "Content-Length" {
				c.Set(key, value)
			}
		}
	}
	return c.SendStream(resp.Body)
}