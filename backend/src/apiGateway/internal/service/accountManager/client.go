package accountmanager

import (
	"bytes"
	"encoding/json"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
)

type accountManagerHTTPClient struct {
	baseURL string
	client  *http.Client
	logger  *zap.Logger
}

func NewClient(baseURL string, logger *zap.Logger) (*accountManagerHTTPClient, error) {
	if baseURL == "" {
		logger.Error("AccountManagerClient base URL is empty",
			zap.String("service", "Avvount-manager"))
		return nil, fmt.Errorf("AccountManagerClient base URL cannot be empty")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger is nil")
	}

	concreteClient := &accountManagerHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
		logger:  logger,
	}

	return concreteClient, nil
}

func (c *accountManagerHTTPClient) ChangeUsername(userID string, req model.ChangeUsernameRequest) error {
	defer c.logger.Sync()

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal change username request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-username"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal change username request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/change-username", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create change username request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-username"),
			zap.Error(err))
		return fmt.Errorf("failed to create change username request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// TODO: Add Authorization header
	//httpReq.Header.Set("Authorization", "Bearer " + getInternalTokenForProfileManager())

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send change username request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-username"),
			zap.Error(err))
		return fmt.Errorf("%w: failed to send change username request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read change username response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-username"),
			zap.Error(err))
		return fmt.Errorf("failed to read change username response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for change username",
				zap.String("service", "profile-manager"),
				zap.String("operation", "change-username"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return fmt.Errorf("profile manager change username failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for change username",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-username"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager change username failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("Username changed successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "change-username"),
		zap.String("user_id", userID))
	return nil
}

func (c *accountManagerHTTPClient) ChangePassword(userID string, req model.ChangePasswordRequest) error {
	defer c.logger.Sync()

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal change password request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-password"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal change password request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/change-password", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create change password request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-password"),
			zap.Error(err))
		return fmt.Errorf("failed to create change password request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// TODO: Add Authorization header
	// httpReq.Header.Set("Authorization", "Bearer " + getInternalTokenForProfileManager())

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send change password request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-password"),
			zap.Error(err))
		return fmt.Errorf("%w: failed to send change password request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read change password response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-password"),
			zap.Error(err))
		return fmt.Errorf("failed to read change password response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for change password",
				zap.String("service", "profile-manager"),
				zap.String("operation", "change-password"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return fmt.Errorf("profile manager change password failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for change password",
			zap.String("service", "profile-manager"),
			zap.String("operation", "change-password"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager change password failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("Password changed successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "change-password"),
		zap.String("user_id", userID))
	return nil
}

func (c *accountManagerHTTPClient) UploadProfilePicture(userID string, filename string, contentType string, fileContent []byte) error {
	defer c.logger.Sync()

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/profile-picture", c.baseURL, userID), bytes.NewBuffer(fileContent))
	if err != nil {
		c.logger.Error("Failed to create upload profile picture request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "upload-profile-picture"),
			zap.Error(err))
		return fmt.Errorf("failed to create upload profile picture request: %w", err)
	}
	httpReq.Header.Set("Content-Type", contentType)
	httpReq.Header.Set("X-Filename", filename)
	// TODO: Add Authorization header
	// httpReq.Header.Set("Authorization", "Bearer " + getInternalTokenForProfileManager())

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send upload profile picture request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "upload-profile-picture"),
			zap.Error(err))
		return fmt.Errorf("%w: failed to send upload profile picture request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read upload profile picture response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "upload-profile-picture"),
			zap.Error(err))
		return fmt.Errorf("failed to read upload profile picture response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for upload profile picture",
				zap.String("service", "profile-manager"),
				zap.String("operation", "upload-profile-picture"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return fmt.Errorf("profile manager upload profile picture failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for upload profile picture",
			zap.String("service", "profile-manager"),
			zap.String("operation", "upload-profile-picture"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager upload profile picture failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("Profile picture uploaded successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "upload-profile-picture"),
		zap.String("user_id", userID),
		zap.String("filename", filename))
	return nil
}

func (c *accountManagerHTTPClient) GenerateTwoFASetup(userID string) (secret string, qrCode string, err error) {
	defer c.logger.Sync()

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/2fa/generate-secret", c.baseURL, userID), nil)
	if err != nil {
		c.logger.Error("Failed to create generate 2FA secret request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "generate-twofa-setup"),
			zap.Error(err))
		return "", "", fmt.Errorf("failed to create generate 2FA secret request: %w", err)
	}
	// TODO: Add Authorization header
	// httpReq.Header.Set("Authorization", "Bearer " + getInternalTokenForProfileManager())

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send generate 2FA secret request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "generate-twofa-setup"),
			zap.Error(err))
		return "", "", fmt.Errorf("%w: failed to send generate 2FA secret request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read generate 2FA secret response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "generate-twofa-setup"),
			zap.Error(err))
		return "", "", fmt.Errorf("failed to read generate 2FA secret response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for generate 2FA secret",
				zap.String("service", "profile-manager"),
				zap.String("operation", "generate-twofa-setup"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return "", "", fmt.Errorf("profile manager generate 2FA secret failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for generate 2FA secret",
			zap.String("service", "profile-manager"),
			zap.String("operation", "generate-twofa-setup"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return "", "", fmt.Errorf("profile manager generate 2FA secret failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var response struct {
		Secret string `json:"secret"`
		QRCode string `json:"qr_code"`
	}
	if err := json.Unmarshal(respBody, &response); err != nil {
		c.logger.Error("Failed to unmarshal generate 2FA secret response",
			zap.String("service", "profile-manager"),
			zap.String("operation", "generate-twofa-setup"),
			zap.Error(err),
			zap.ByteString("raw_body", respBody))
		return "", "", fmt.Errorf("failed to unmarshal generate 2FA secret response: %w, raw: %s", err, string(respBody))
	}

	c.logger.Debug("2FA secret generated successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "generate-twofa-setup"),
		zap.String("user_id", userID))
	return response.Secret, response.QRCode, nil
}

func (c *accountManagerHTTPClient) VerifyAndEnableTwoFA(userID string, req model.VerifyTwoFARequest) error {
	defer c.logger.Sync()

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal verify and enable 2FA request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-and-enable-twofa"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal verify and enable 2FA request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/2fa/enable", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create verify and enable 2FA request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-and-enable-twofa"),
			zap.Error(err))
		return fmt.Errorf("failed to create verify and enable 2FA request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// TODO: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send verify and enable 2FA request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-and-enable-twofa"),
			zap.Error(err))
		return fmt.Errorf("%w: failed to send verify and enable 2FA request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read verify and enable 2FA response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-and-enable-twofa"),
			zap.Error(err))
		return fmt.Errorf("failed to read verify and enable 2FA response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for verify and enable 2FA",
				zap.String("service", "profile-manager"),
				zap.String("operation", "verify-and-enable-twofa"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return fmt.Errorf("profile manager verify and enable 2FA failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for verify and enable 2FA",
			zap.String("service", "profile-manager"),
			zap.String("operation", "verify-and-enable-twofa"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager verify and enable 2FA failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("2FA verified and enabled successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "verify-and-enable-twofa"),
		zap.String("user_id", userID))
	return nil
}

func (c *accountManagerHTTPClient) DisableTwoFA(userID string, req model.DisableTwoFARequest) error {
	defer c.logger.Sync()

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal disable 2FA request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "disable-twofa"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal disable 2FA request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/2fa/disable", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create disable 2FA request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "disable-twofa"),
			zap.Error(err))
		return fmt.Errorf("failed to create disable 2FA request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// TODO: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send disable 2FA request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "disable-twofa"),
			zap.Error(err))
		return fmt.Errorf("%w: failed to send disable 2FA request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read disable 2FA response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "disable-twofa"),
			zap.Error(err))
		return fmt.Errorf("failed to read disable 2FA response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for disable 2FA",
				zap.String("service", "profile-manager"),
				zap.String("operation", "disable-twofa"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return fmt.Errorf("profile manager disable 2FA failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for disable 2FA",
			zap.String("service", "profile-manager"),
			zap.String("operation", "disable-twofa"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager disable 2FA failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("2FA disabled successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "disable-twofa"),
		zap.String("user_id", userID))
	return nil
}

func (c *accountManagerHTTPClient) GetUsers() ([]model.User, error) {
	defer c.logger.Sync()

	httpReq, err := http.NewRequest(http.MethodGet, c.baseURL+"/users", nil)
	if err != nil {
		c.logger.Error("Failed to create get users request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-users"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create get users request: %w", err)
	}
	// TODO: Add Authorization header for admin access

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send get users request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-users"),
			zap.Error(err))
		return nil, fmt.Errorf("%w: failed to send get users request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read get users response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-users"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to read get users response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for get users",
				zap.String("service", "profile-manager"),
				zap.String("operation", "get-users"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			return nil, fmt.Errorf("profile manager get users failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for get users",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-users"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("profile manager get users failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var users []model.User
	if err := json.Unmarshal(respBody, &users); err != nil {
		c.logger.Error("Failed to unmarshal get users response",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-users"),
			zap.Error(err),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("failed to unmarshal get users response: %w, raw: %s", err, string(respBody))
	}

	c.logger.Debug("Users retrieved successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "get-users"),
		zap.Int("user_count", len(users)))
	return users, nil
}

func (c *accountManagerHTTPClient) GetUserByID(userID string) (*model.User, error) {
	defer c.logger.Sync()

	httpReq, err := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/users/%s", c.baseURL, userID), nil)
	if err != nil {
		c.logger.Error("Failed to create get user by ID request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-user-by-id"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create get user by ID request: %w", err)
	}
	// TODO: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send get user by ID request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-user-by-id"),
			zap.Error(err))
		return nil, fmt.Errorf("%w: failed to send get user by ID request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read get user by ID response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-user-by-id"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to read get user by ID response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for get user by ID",
				zap.String("service", "profile-manager"),
				zap.String("operation", "get-user-by-id"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusNotFound {
				return nil, fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return nil, fmt.Errorf("profile manager get user by ID failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for get user by ID",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-user-by-id"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("profile manager get user by ID failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var user model.User
	if err := json.Unmarshal(respBody, &user); err != nil {
		c.logger.Error("Failed to unmarshal get user by ID response",
			zap.String("service", "profile-manager"),
			zap.String("operation", "get-user-by-id"),
			zap.Error(err),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("failed to unmarshal get user by ID response: %w, raw: %s", err, string(respBody))
	}

	c.logger.Debug("User retrieved successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "get-user-by-id"),
		zap.String("user_id", userID))
	return &user, nil
}

func (c *accountManagerHTTPClient) CreateUser(req model.RegisterRequest) (*model.User, error) {
	defer c.logger.Sync()

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal create user request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "create-user"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to marshal create user request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/users", bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create create user request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "create-user"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to create create user request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// TODO: Add Authorization header for admin access

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send create user request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "create-user"),
			zap.Error(err))
		return nil, fmt.Errorf("%w: failed to send create user request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read create user response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "create-user"),
			zap.Error(err))
		return nil, fmt.Errorf("failed to read create user response body: %w", err)
	}

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for create user",
				zap.String("service", "profile-manager"),
				zap.String("operation", "create-user"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusConflict {
				return nil, fmt.Errorf("%w: %s", service.ErrUserAlreadyExists, errorResp.Message)
			}
			return nil, fmt.Errorf("profile manager create user failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for create user",
			zap.String("service", "profile-manager"),
			zap.String("operation", "create-user"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("profile manager create user failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var user model.User
	if err := json.Unmarshal(respBody, &user); err != nil {
		c.logger.Error("Failed to unmarshal create user response",
			zap.String("service", "profile-manager"),
			zap.String("operation", "create-user"),
			zap.Error(err),
			zap.ByteString("raw_body", respBody))
		return nil, fmt.Errorf("failed to unmarshal create user response: %w, raw: %s", err, string(respBody))
	}

	c.logger.Debug("User created successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "create-user"),
		zap.String("user_id", user.ID))
	return &user, nil
}
func (c *accountManagerHTTPClient) UpdateUser(userID string, req model.User) error {
	defer c.logger.Sync()

	body, err := json.Marshal(req)
	if err != nil {
		c.logger.Error("Failed to marshal update user request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal update user request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/users/%s", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create update user request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user"),
			zap.Error(err))
		return fmt.Errorf("failed to create update user request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// TODO: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send update user request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user"),
			zap.Error(err))
		return fmt.Errorf("%w: failed to send update user request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read update user response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user"),
			zap.Error(err))
		return fmt.Errorf("failed to read update user response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for update user",
				zap.String("service", "profile-manager"),
				zap.String("operation", "update-user"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusNotFound {
				return fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return fmt.Errorf("profile manager update user failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for update user",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager update user failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("User updated successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "update-user"),
		zap.String("user_id", userID))
	return nil
}

func (c *accountManagerHTTPClient) DeleteUser(userID string) error {
	defer c.logger.Sync()

	httpReq, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/users/%s", c.baseURL, userID), nil)
	if err != nil {
		c.logger.Error("Failed to create delete user request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "delete-user"),
			zap.Error(err))
		return fmt.Errorf("failed to create delete user request: %w", err)
	}
	// TODO: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send delete user request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "delete-user"),
			zap.Error(err))
		return fmt.Errorf("%w: failed to send delete user request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read delete user response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "delete-user"),
			zap.Error(err))
		return fmt.Errorf("failed to read delete user response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for delete user",
				zap.String("service", "profile-manager"),
				zap.String("operation", "delete-user"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusNotFound {
				return fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return fmt.Errorf("profile manager delete user failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for delete user",
			zap.String("service", "profile-manager"),
			zap.String("operation", "delete-user"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager delete user failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("User deleted successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "delete-user"),
		zap.String("user_id", userID))
	return nil
}

func (c *accountManagerHTTPClient) UpdateUserRoles(userID string, roles []string) error {
	defer c.logger.Sync()

	reqBody := model.UpdateUserRolesRequest{Roles: roles}
	body, err := json.Marshal(reqBody)
	if err != nil {
		c.logger.Error("Failed to marshal update user roles request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user-roles"),
			zap.Error(err))
		return fmt.Errorf("failed to marshal update user roles request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/users/%s/roles", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		c.logger.Error("Failed to create update user roles request",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user-roles"),
			zap.Error(err))
		return fmt.Errorf("failed to create update user roles request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// TODO: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		c.logger.Error("Failed to send update user roles request to Profile Manager",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user-roles"),
			zap.Error(err))
		return fmt.Errorf("%w: failed to send update user roles request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.logger.Error("Failed to read update user roles response body",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user-roles"),
			zap.Error(err))
		return fmt.Errorf("failed to read update user roles response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			c.logger.Error("Profile Manager returned error response for update user roles",
				zap.String("service", "profile-manager"),
				zap.String("operation", "update-user-roles"),
				zap.Int("status", resp.StatusCode),
				zap.String("message", errorResp.Message),
				zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusNotFound {
				return fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return fmt.Errorf("profile manager update user roles failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		c.logger.Error("Profile Manager returned unexpected error status for update user roles",
			zap.String("service", "profile-manager"),
			zap.String("operation", "update-user-roles"),
			zap.Int("status", resp.StatusCode),
			zap.ByteString("raw_body", respBody))
		return fmt.Errorf("profile manager update user roles failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	c.logger.Debug("User roles updated successfully",
		zap.String("service", "profile-manager"),
		zap.String("operation", "update-user-roles"),
		zap.String("user_id", userID),
		zap.Strings("roles", roles))
	return nil
}
