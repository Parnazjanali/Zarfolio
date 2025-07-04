package handler

import (
	"errors"
	"fmt"
	"profile-gold/internal/model"
	"profile-gold/internal/service"
	"profile-gold/internal/utils"
	"strings"
	"time" // Added for TTL calculation

	"github.com/golang-jwt/jwt/v5" // Added for token parsing
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthHandler struct {
	userService  service.UserService
	redisService *service.RedisService // Added RedisService
}

// NewAuthHandler now accepts RedisService
func NewAuthHandler(us service.UserService, rs *service.RedisService) *AuthHandler {
	if us == nil {
		utils.Log.Fatal("UserService cannot be nil for AuthHandler in Profile Manager.")
	}
	if rs == nil {
		utils.Log.Fatal("RedisService cannot be nil for AuthHandler in Profile Manager.")
	}
	return &AuthHandler{userService: us, redisService: rs}
}

type ProfileHandler struct {
	userService service.UserService
}

func NewProfileHandler(us service.UserService) *ProfileHandler {
	if us == nil {
		utils.Log.Fatal("UserService cannot be nil for ProfileHandler in Profile Manager.")
	}
	return &ProfileHandler{userService: us}
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
	if errParser := c.BodyParser(&req); errParser != nil { // Renamed err to errParser to avoid conflict
		utils.Log.Error("Login: Failed to parse login request body", zap.Error(errParser))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format", Code: "400_INVALID_FORMAT",
		})
	}

	if req.Username == "" || req.Password == "" {
		utils.Log.Warn("Login: Attempt with empty credentials", zap.String("username", req.Username))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Username and password are required", Code: "400_MISSING_FIELDS",
		})
	}

	user, token, claims, err := h.userService.AuthenticateUser(req.Username, req.Password) // err is the one from AuthenticateUser

	if err != nil {
		if errors.Is(err, service.ErrTwoFARequired) {
			// Password was correct, but 2FA is needed.
			// User object is returned by AuthenticateUser in this case.
			utils.Log.Info("Login: 2FA required for user", zap.String("userID", user.ID))
			return c.Status(fiber.StatusOK).JSON(model.LoginStep1Response{ // Use 200 OK with specific payload
				TwoFARequired: true,
				UserID:        user.ID, // Send UserID for the next step
				Message:       "2FA code required.",
			})
		}
		if errors.Is(err, service.ErrInvalidCredentials) || errors.Is(err, service.ErrUserNotFound) {
			utils.Log.Warn("Login: Invalid credentials or user not found", zap.String("username", req.Username), zap.Error(err))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Code: "401_INVALID_CREDENTIALS", Message: "Invalid username or password.",
			})
		}
		utils.Log.Error("Login: Internal error during authentication", zap.String("username", req.Username), zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error during authentication.", Code: "500_INTERNAL_ERROR",
		})
	}

	// If 2FA was not required, and no other error, token is generated by service.
	utils.Log.Info("Login: User logged in successfully (no 2FA or 2FA already passed if flow changes)", zap.String("username", user.Username))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful",
		Token:   token,
		User:    user, // User object from AuthenticateUser
		Exp:     claims.ExpiresAt.Unix(),
	})
}

func (h *AuthHandler) HandleLoginTwoFA(c *fiber.Ctx) error {
	var req model.LoginTwoFARequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("HandleLoginTwoFA: Failed to parse request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request format.", Code: "400_INVALID_FORMAT",
		})
	}

	if req.UserID == "" || req.TOTPCode == "" {
		utils.Log.Warn("HandleLoginTwoFA: UserID or TOTPCode missing")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "UserID and TOTP code are required.", Code: "400_MISSING_FIELDS",
		})
	}

	// Validate TOTP code
	isValid, err := h.userService.VerifyTOTP(req.UserID, req.TOTPCode)
	if err != nil { // This catches ErrUserNotFound, ErrTwoFANotEnabled, ErrTwoFAInvalidCode, ErrInternalService (e.g. decryption failed)
		utils.Log.Warn("HandleLoginTwoFA: Verification failed or error during userService.VerifyTOTP", zap.String("userID", req.UserID), zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) || errors.Is(err, service.ErrTwoFANotEnabled) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "2FA verification failed. User or 2FA setup not found.", Code: "401_2FA_SETUP_ISSUE"})
		}
		if errors.Is(err, service.ErrTwoFAInvalidCode) {
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Invalid 2FA code.", Code: "401_INVALID_2FA_CODE"})
		}
		// Any other error (e.g., wrapped ErrInternalService from decryption)
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error during 2FA verification.", Code: "500_INTERNAL_ERROR"})
	}

	// If err is nil, then 'isValid' must be true based on current service logic.
	// This check is a safeguard against unexpected (false, nil) returns from the service.
	if !isValid {
		utils.Log.Error("HandleLoginTwoFA: userService.VerifyTOTP returned (false, nil), which is unexpected. Treating as invalid code.", zap.String("userID", req.UserID))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "Invalid 2FA code (unexpected server state).", Code: "401_INVALID_2FA_CODE_UNEXPECTED",
		})
	}

	// If we reach here, isValid is true and err was nil.
	finalUser, err := h.userService.GetUserByIDForTokenGeneration(req.UserID)
	if err != nil {
		utils.Log.Error("HandleLoginTwoFA: Could not retrieve user for token generation after 2FA success", zap.String("userID", req.UserID), zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Error finalizing login.", Code: "500_LOGIN_FINALIZE_ERROR"})
	}

	// Generate final JWT token
	finalToken, finalClaims, err := utils.GenerateJWTToken(finalUser)
	if err != nil {
		utils.Log.Error("HandleLoginTwoFA: Failed to generate final JWT token", zap.String("userID", req.UserID), zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to finalize login session.", Code: "500_TOKEN_GENERATION_ERROR"})
	}

	utils.Log.Info("HandleLoginTwoFA: User successfully logged in with 2FA", zap.String("userID", req.UserID))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{
		Message: "Login successful with 2FA.",
		Token:   finalToken,
		User:    finalUser,
		Exp:     finalClaims.ExpiresAt.Unix(),
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

	// 1. Validate the token and get claims
	claims, err := utils.ValidateJWTToken(tokenString)
	if err != nil {
		// Handle different error types from ValidateJWTToken
		if errors.Is(err, jwt.ErrTokenExpired) {
			utils.Log.Warn("Logout attempt with already expired token", zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]), zap.Error(err))
			// No need to blacklist an already expired token. Still, proceed with other logout operations.
		} else if errors.Is(err, jwt.ErrTokenMalformed) || errors.Is(err, jwt.ErrTokenSignatureInvalid) || errors.Is(err, jwt.ErrTokenNotValidYet) {
			utils.Log.Warn("Logout attempt with invalid token", zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]), zap.Error(err))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid token provided for logout.",
				Code:    "401_INVALID_TOKEN_LOGOUT",
			})
		} else {
			// Other validation errors (e.g. claim validation if added, or unexpected errors)
			utils.Log.Error("Error validating token during logout", zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]), zap.Error(err))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Token validation failed during logout.",
				Code:    "401_VALIDATION_FAILED_LOGOUT",
			})
		}
		// If token was expired, we still continue to h.userService.LogoutUser for any other cleanup.
		// If it was invalid, we returned early.
	}

	// 2. If token is valid and not expired, add to blacklist
	if claims != nil && claims.ExpiresAt != nil {
		remainingValidity := time.Until(claims.ExpiresAt.Time)
		if remainingValidity > 0 {
			jti := claims.RegisteredClaims.ID
			if jti == "" {
				utils.Log.Error("Logout: JTI claim is missing in token, cannot blacklist", zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]))
				// Potentially return an error or just log, depending on policy
			} else {
				errBlacklist := h.redisService.AddToBlacklist(jti, remainingValidity)
				if errBlacklist != nil {
					utils.Log.Error("Logout: Failed to add token to Redis blacklist", zap.String("jti", jti), zap.Error(errBlacklist))
					// Depending on policy, this might be a critical failure or just logged.
					// For now, we log it and proceed with other logout logic.
				} else {
					utils.Log.Info("Logout: Token successfully blacklisted", zap.String("jti", jti), zap.Duration("ttl", remainingValidity))
				}
			}
		} else {
			utils.Log.Info("Logout: Token already expired, no need to blacklist", zap.String("jti", claims.RegisteredClaims.ID))
		}
	}


	// 3. Perform other logout operations via userService (e.g., audit logging, session clearing if any)
	// This was the original call in the Logout function.
	// Note: If userService.LogoutUser also validates the token, there might be redundant validation.
	// For now, we assume it performs other duties beyond just token validation.
	errUserServiceLogout := h.userService.LogoutUser(tokenString)
	if errUserServiceLogout != nil {
		utils.Log.Error("Profile Manager Handler: Error from userService.LogoutUser", zap.Error(errUserServiceLogout), zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]))
		// This error handling might need to be more nuanced.
		// If the token was invalid to begin with, this might also return an error.
		// We've already handled some token validation, so we might not need to be as strict here,
		// or we could consolidate error responses.
		// For now, mirroring original logic for errors from this service call:
		if errors.Is(errUserServiceLogout, service.ErrInvalidCredentials) { // Assuming this means invalid/expired token to the service
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid or expired token according to user service.", // Message could be improved
				Code:    "401_USER_SERVICE_TOKEN_ISSUE",
			})
		}
		if errors.Is(errUserServiceLogout, service.ErrInternalService) {
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
				Message: "Internal server error during user service logout.",
				Code:    "500_USER_SERVICE_LOGOUT_ERROR",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "An unexpected error occurred during user service logout.",
			Code:    "500_USER_SERVICE_UNEXPECTED_LOGOUT_ERROR",
		})
	}

	utils.Log.Info("Profile Manager Handler: User logged out successfully", zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 10)]))
	return c.Status(fiber.StatusOK).JSON(model.AuthResponse{ // model.AuthResponse might not be the most semantically correct for logout. A simple success message might be better.
		Message: "Logged out successfully!",
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

func (h *AuthHandler) HandleRequestPasswordReset(c *fiber.Ctx) error {
	var req model.RequestPasswordResetRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("HandleRequestPasswordReset: Failed to parse request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format.",
			Code:    "400",
		})
	}

	// TODO: Add validation for req.Email (e.g., using a validator library or simple checks)
	if req.Email == "" { // Basic validation
		utils.Log.Warn("HandleRequestPasswordReset: Email field is missing")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Email is required.",
			Code:    "400_EMAIL_REQUIRED",
		})
	}

	_, err := h.userService.RequestPasswordReset(req.Email) // Token is logged by service for now
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			// To prevent email enumeration, it's often better to return a generic success message.
			// However, for easier debugging during development, we can be more specific.
			// Or, the service itself can handle this logging and return a generic nil error.
			utils.Log.Info("HandleRequestPasswordReset: Password reset requested for potentially non-existent email", zap.String("email", req.Email))
			// Return a success-like response to avoid revealing if an email exists or not.
			return c.Status(fiber.StatusOK).JSON(fiber.Map{
				"message": "If an account with that email exists, a password reset link has been sent.",
			})
		}
		utils.Log.Error("HandleRequestPasswordReset: Error in RequestPasswordReset service call", zap.String("email", req.Email), zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error while requesting password reset.",
			Code:    "500",
		})
	}

	utils.Log.Info("HandleRequestPasswordReset: Password reset process initiated successfully for email (actual email sending TBD)", zap.String("email", req.Email))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "If an account with that email exists, a password reset link has been sent.",
	})
}

func (h *AuthHandler) HandleResetPassword(c *fiber.Ctx) error {
	var req model.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("HandleResetPassword: Failed to parse request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body format.",
			Code:    "400",
		})
	}

	// TODO: Add validation for req.Token and req.NewPassword
	if req.Token == "" || req.NewPassword == "" { // Basic validation
		utils.Log.Warn("HandleResetPassword: Token or NewPassword field is missing")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Token and new password are required.",
			Code:    "400_TOKEN_PASSWORD_REQUIRED",
		})
	}

	err := h.userService.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		// Determine token prefix for safe logging
		tokenPrefix := req.Token
		if len(req.Token) > 10 {
			tokenPrefix = req.Token[:10]
		}

		if errors.Is(err, service.ErrPasswordResetTokenInvalid) {
			utils.Log.Warn("HandleResetPassword: Invalid or expired token used", zap.String("token_prefix", tokenPrefix), zap.Error(err))
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{ // 400 or 401 could be argued
				Message: "Invalid or expired password reset token.",
				Code:    "400_INVALID_TOKEN",
			})
		}
		utils.Log.Error("HandleResetPassword: Error in ResetPassword service call", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Internal server error while resetting password.",
			Code:    "500",
		})
	}

	utils.Log.Info("HandleResetPassword: Password has been reset successfully.")
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Password has been reset successfully. You can now login with your new password.",
	})
}