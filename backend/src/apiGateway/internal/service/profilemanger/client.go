package profilemanager

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	"io"
	"net/http"
	"os"
	"syscall"
	"time"
	"gold-api/internal/utils"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

type profileManagerHTTPClient struct {
	baseURL string
	client  *http.Client
	logger  *zap.Logger // اضافه کردن logger به struct
}

func NewClient(baseURL string, logger *zap.Logger) (ProfileManagerClient, error) {
	if baseURL == "" {
		logger.Error("ProfileManagerClient base URL is empty",
			zap.String("service", "profile-manager"))
		return nil, fmt.Errorf("ProfileManagerClient base URL cannot be empty")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger is nil")
	}

	concreteClient := &profileManagerHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
		logger:  logger,
	}

	return concreteClient, nil
}
func (c *profileManagerHTTPClient) BaseURL() string {
	return c.baseURL
}

func (c *profileManagerHTTPClient) AuthenticateUser(username, password string) (*model.User, string, *model.CustomClaims, error) {
	defer c.logger.Sync() // اطمینان از flush شدن لاگ‌ها

	req := model.LoginRequest{Username: username, Password: password}
	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal login request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "authenticate-user"),
			zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to marshal login request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/login", bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create HTTP request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "authenticate-user"),
			zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "authenticate-user"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return nil, "", nil, fmt.Errorf("%w: timeout connecting to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return nil, "", nil, fmt.Errorf("%w: connection refused to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return nil, "", nil, fmt.Errorf("failed to send request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read Profile Manager login response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "authenticate-user"),
			zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to read profile manager login response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response",
				zap.String("service", "profile-manager"),
				zap.String("operation", "authenticate-user"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusUnauthorized {
				return nil, "", nil, fmt.Errorf("%w: %s", service.ErrInvalidCredentials, errorResp.Message)
			}
			return nil, "", nil, fmt.Errorf("profile manager login failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status",
			zap.String("service", "profile-manager"),
			zap.String("operation", "authenticate-user"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		if resp.StatusCode == http.StatusUnauthorized {
			return nil, "", nil, fmt.Errorf("%w: invalid credentials", service.ErrInvalidCredentials)
		}
		return nil, "", nil, fmt.Errorf("profile manager login failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var authResp model.AuthResponse
	if err := json.Unmarshal(respBody, &authResp); err != nil {
		c.logger.Error("Failed to unmarshal Profile Manager login response",
			zap.String("service", "profile-manager"),
			zap.String("operation", "authenticate-user"),
			zap.Error(err),
			zap.ByteString("raw_body", respBody))
		return nil, "", nil, fmt.Errorf("failed to unmarshal profile manager login response: %w, raw: %s", err, string(respBody))
	}

	if authResp.User == nil || authResp.User.ID == "" {
		c.logger.Error("Profile Manager did not return complete user details",
			zap.String("service", "profile-manager"),
			zap.String("operation", "authenticate-user"))
		return nil, "", nil, errors.New("profile manager did not return complete user details")
	}

	claims := &model.CustomClaims{
		UserID:   authResp.User.ID,
		Username: authResp.User.Username,
		Roles:    authResp.User.Roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Unix(authResp.Exp, 0)),
		},
	}

	c.logger.Debug("User authenticated successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "authenticate-user"),
		zap.String("user_id", authResp.User.ID))
	return authResp.User, authResp.Token, claims, nil
}
func (c *profileManagerHTTPClient) RegisterUser(req model.RegisterRequest) error {
	defer c.logger.Sync() // اطمینان از flush شدن لاگ‌ها

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal register request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "register-user"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal register request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/register", bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create registration request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "register-user"),
			zap.Error(err))
		return fmt.Errorf("failed to create registration request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send registration request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "register-user"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return fmt.Errorf("%w: timeout connecting to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: connection refused to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send registration request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read profile manager registration response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "register-user"),
			zap.Error(err))
		return fmt.Errorf("failed to read profile manager registration response body: %w", err)
	}

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for registration",
				zap.String("service", "profile-manager"),
				zap.String("operation", "register-user"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusConflict {
				return fmt.Errorf("%w: %s", service.ErrUserAlreadyExists, errorResp.Message)
			}
			return fmt.Errorf("profile manager registration failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for registration",
			zap.String("service", "profile-manager"),
			zap.String("operation", "register-user"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager registration failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("User registered successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "register-user"),
		zap.String("username", req.Username)) // فرض می‌کنیم req.Username وجود داره
	return nil
}

func (c *profileManagerHTTPClient) LogoutUser(token string) error {
	defer c.logger.Sync()

	if token == "" {
		c.logger.Error("Token is empty for logout",
			zap.String("service", "profile-manager"),
			zap.String("operation", "logout-user"))
		return fmt.Errorf("%w: token is empty for logout", service.ErrInternalService)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/logout", nil)
	if err != nil {
		c.logger.Error("Failed to create logout request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "logout-user"),
			zap.Error(err))
		return fmt.Errorf("failed to create logout request: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)

	internalServiceSecret := os.Getenv("PROFILE_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		c.logger.Error("PROFILE_MANAGER_SERVICE_SECRET environment variable is not set",
			zap.String("service", "profile-manager"),
			zap.String("operation", "logout-user"))
		return fmt.Errorf("PROFILE_MANAGER_SERVICE_SECRET environment variable is not set for internal communication")
	}
	httpReq.Header.Set("X-Service-Secret", internalServiceSecret)

	c.logger.Debug("Sending logout request to Profile Manager",
		zap.String("service", "profile-manager"),
		zap.String("operation", "logout-user"),
		zap.String("url", c.baseURL+"/auth/logout"),
		zap.String("token_prefix", token[:utils.Min(len(token), 10)]))

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Error sending logout request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "logout-user"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return fmt.Errorf("%w: timeout connecting to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: connection refused to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send logout request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read Profile Manager logout response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "logout-user"),
			zap.Error(err))
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for logout",
				zap.String("service", "profile-manager"),
				zap.String("operation", "logout-user"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusUnauthorized {
				return fmt.Errorf("%w: %s", service.ErrInvalidCredentials, errorResp.Message)
			}
			return fmt.Errorf("profile manager logout failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for logout",
			zap.String("service", "profile-manager"),
			zap.String("operation", "logout-user"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		if resp.StatusCode == http.StatusUnauthorized {
			return fmt.Errorf("%w: invalid or expired token", service.ErrInvalidCredentials)
		}
		return fmt.Errorf("profile manager logout failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("User logged out successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "logout-user"),
		zap.String("token_prefix", token[:utils.Min(len(token), 10)]))
	return nil
}
func (c *profileManagerHTTPClient) RequestPasswordReset(email string) error {
	defer c.logger.Sync()

	reqBody := map[string]string{"email": email}
	body, err := json.Marshal(reqBody)
	if err != nil {
		c.logger.Error("Failed to marshal request password reset body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "request-password-reset"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal request password reset body: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/password/request-reset", bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create password reset request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "request-password-reset"),
			zap.Error(err))
		return fmt.Errorf("failed to create password reset request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send password reset request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "request-password-reset"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send password reset request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read password reset response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "request-password-reset"),
			zap.Error(err))
		return fmt.Errorf("failed to read password reset response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for password reset",
				zap.String("service", "profile-manager"),
				zap.String("operation", "request-password-reset"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusNotFound {
				return fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return fmt.Errorf("profile manager password reset request failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for password reset",
			zap.String("service", "profile-manager"),
			zap.String("operation", "request-password-reset"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager password reset request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("Password reset request sent successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "request-password-reset"),
		zap.String("email", email))
	return nil
}
func (c *profileManagerHTTPClient) ResetPassword(token, newPassword string) error {
	defer c.logger.Sync()

	reqBody := model.ResetPasswordRequest{Token: token, NewPassword: newPassword}
	body, err := json.Marshal(reqBody)
	if err != nil {
		c.logger.Error("Failed to marshal reset password body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "reset-password"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal reset password body: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/password/reset", bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create reset password request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "reset-password"),
			zap.Error(err))
		return fmt.Errorf("failed to create reset password request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send reset password request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "reset-password"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send reset password request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read reset password response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "reset-password"),
			zap.Error(err))
		return fmt.Errorf("failed to read reset password response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for reset password",
				zap.String("service", "profile-manager"),
				zap.String("operation", "reset-password"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusUnauthorized {
				return fmt.Errorf("%w: %s", service.ErrInvalidToken, errorResp.Message)
			}
			return fmt.Errorf("profile manager reset password failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for reset password",
			zap.String("service", "profile-manager"),
			zap.String("operation", "reset-password"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager reset password failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("Password reset successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "reset-password"),
		zap.String("token_prefix", token[:utils.Min(len(token), 10)]))
	return nil
}

func (c *profileManagerHTTPClient) VerifyTwoFACode(username, code string) (*model.User, string, *model.CustomClaims, error) {
	defer c.logger.Sync()

	reqBody := model.VerifyTwoFARequest{Code: code}
	body, err := json.Marshal(reqBody)
	if err != nil {
		c.logger.Error("Failed to marshal 2FA verification request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-twofa-code"),
			zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to marshal 2FA verification request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/2fa/verify", bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create 2FA verification request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-twofa-code"),
			zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to create 2FA verification request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send 2FA verification request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-twofa-code"),
			zap.Error(err))
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return nil, "", nil, fmt.Errorf("%w: cannot connect to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return nil, "", nil, fmt.Errorf("failed to send 2FA verification request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read 2FA verification response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-twofa-code"),
			zap.Error(err))
		return nil, "", nil, fmt.Errorf("failed to read 2FA verification response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for 2FA verification",
				zap.String("service", "profile-manager"),
				zap.String("operation", "verify-twofa-code"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusUnauthorized {
				return nil, "", nil, fmt.Errorf("%w: %s", service.ErrInvalidTwoFACode, errorResp.Message)
			}
			return nil, "", nil, fmt.Errorf("profile manager 2FA verification failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for 2FA verification",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-twofa-code"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return nil, "", nil, fmt.Errorf("profile manager 2FA verification failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var authResp model.AuthResponse
	if err := json.Unmarshal(respBody, &authResp); err != nil {
		c.logger.Error("Failed to unmarshal 2FA verification response",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-twofa-code"),
			zap.Error(err),
			zap.ByteString("raw_body", respBody))
		return nil, "", nil, fmt.Errorf("failed to unmarshal 2FA verification response: %w, raw: %s", err, string(respBody))
	}

	if authResp.User == nil || authResp.User.ID == "" {
		c.logger.Error("Profile Manager did not return complete user details after 2FA verification",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-twofa-code"))
		return nil, "", nil, errors.New("profile manager did not return complete user details after 2FA verification")
	}

	claims := &model.CustomClaims{
		UserID:   authResp.User.ID,
		Username: authResp.User.Username,
		Roles:    authResp.User.Roles,
	}

	c.logger.Debug("2FA verification successful",
		zap.String("service", "profile-manager"),
		zap.String("operation", "verify-twofa-code"),
		zap.String("user_id", authResp.User.ID))
	return authResp.User, authResp.Token, claims, nil
}
