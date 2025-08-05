package profilemanager

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	"gold-api/internal/utils"
	"io"
	"net/http"
	"os"
	"syscall"
	"time"

<<<<<<< HEAD
	"go.uber.org/zap"
)


type profileManagerHTTPClient struct {
    baseURL string
    client  *http.Client
}

func NewClient(baseURL string) (ProfileManagerClient, error) { // این تابع باید همیشه یک خطا هم برگردونه
    if baseURL == "" {
        return nil, fmt.Errorf("ProfileManagerClient base URL cannot be empty")
    }

    concreteClient := &profileManagerHTTPClient{ 
        baseURL: baseURL,
        client:  &http.Client{Timeout: 10 * time.Second}, 
    }
    
    return concreteClient, nil 
=======
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
)

type profileManagerHTTPClient struct {
	baseURL string
	client  *http.Client
}

func NewClient(baseURL string) (ProfileManagerClient, error) {
	if baseURL == "" {
		return nil, fmt.Errorf("ProfileManagerClient base URL cannot be empty")
	}

	concreteClient := &profileManagerHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second},
	}

	return concreteClient, nil
>>>>>>> parnaz-changes
}

func (c *profileManagerHTTPClient) AuthenticateUser(username, password string) (*model.User, string, *model.CustomClaims, error) {
	req := model.LoginRequest{Username: username, Password: password}
	body, err := json.Marshal(req)
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to marshal login request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/login", bytes.NewBuffer(body))
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to create HTTP request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) { // Changed to os.ErrDeadlineExceeded
			return nil, "", nil, fmt.Errorf("%w: timeout connecting to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
<<<<<<< HEAD
		if errors.Is(err, syscall.ECONNREFUSED) { 
=======
		if errors.Is(err, syscall.ECONNREFUSED) {
>>>>>>> parnaz-changes
			return nil, "", nil, fmt.Errorf("%w: connection refused to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return nil, "", nil, fmt.Errorf("failed to send request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body) // Use io.ReadAll instead of ioutil.ReadAll
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to read profile manager login response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {

		var errorResp model.ErrorResponse

		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {

			utils.Log.Error("Profile Manager returned error response", zap.Int("status", resp.StatusCode), zap.String("message", errorResp.Message), zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusUnauthorized {
				return nil, "", nil, fmt.Errorf("%w: %s", service.ErrInvalidCredentials, errorResp.Message)
			}
			return nil, "", nil, fmt.Errorf("profile manager login failed: %s (%d)", errorResp.Message, resp.StatusCode)
		} else {

			utils.Log.Error("Profile Manager returned unexpected error status", zap.Int("status", resp.StatusCode), zap.ByteString("raw_body", respBody))
			if resp.StatusCode == http.StatusUnauthorized {
				return nil, "", nil, fmt.Errorf("%w: invalid credentials", service.ErrInvalidCredentials)
			}
			return nil, "", nil, fmt.Errorf("profile manager login failed with status %d: %s", resp.StatusCode, string(respBody))
		}
	}

	var authResp model.AuthResponse
	if err := json.Unmarshal(respBody, &authResp); err != nil {
		return nil, "", nil, fmt.Errorf("failed to unmarshal profile manager login response: %w, raw: %s", err, string(respBody))
	}

	if authResp.User == nil || authResp.User.ID == "" {
		return nil, "", nil, errors.New("profile manager did not return complete user details")
	}

	claims := &model.CustomClaims{
		UserID:   authResp.User.ID,
		Username: authResp.User.Username,
		Roles:    authResp.User.Roles,
<<<<<<< HEAD
	}

=======
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Unix(authResp.Exp, 0)),
		},
	}
>>>>>>> parnaz-changes
	return authResp.User, authResp.Token, claims, nil
}

func (c *profileManagerHTTPClient) BaseURL() string {
	return c.baseURL
}

func (c *profileManagerHTTPClient) RegisterUser(req model.RegisterRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal register request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/register", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create registration request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return fmt.Errorf("%w: timeout connecting to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: connection refused to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send registration request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body) // Use io.ReadAll
	if err != nil {
		return fmt.Errorf("failed to read profile manager registration response body: %w", err)
	}

<<<<<<< HEAD
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK { // Register might return 200 or 201
=======
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
>>>>>>> parnaz-changes
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			utils.Log.Error("Profile Manager returned error response for registration", zap.Int("status", resp.StatusCode), zap.String("message", errorResp.Message), zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusConflict {
				return fmt.Errorf("%w: %s", service.ErrUserAlreadyExists, errorResp.Message)
			}
			return fmt.Errorf("profile manager registration failed: %s (%d)", errorResp.Message, resp.StatusCode)
		} else {
			utils.Log.Error("Profile Manager returned unexpected error status for registration", zap.Int("status", resp.StatusCode), zap.ByteString("raw_body", respBody))
			if resp.StatusCode == http.StatusConflict {
				return fmt.Errorf("%w: user with this username or email already exists", service.ErrUserAlreadyExists)
			}
			return fmt.Errorf("profile manager registration failed with status %d: %s", resp.StatusCode, string(respBody))
		}
	}

	return nil
}

func (c *profileManagerHTTPClient) LogoutUser(token string) error {
	if token == "" {
		return fmt.Errorf("%w: token is empty for logout", service.ErrInternalService)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/logout", nil)
	if err != nil {
		return fmt.Errorf("failed to create logout request: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)

<<<<<<< HEAD
	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
			return fmt.Errorf("%w: timeout connecting to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		if errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: connection refused to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send logout request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body) // Use io.ReadAll
	if err != nil {
		utils.Log.Error("Failed to read profile manager logout response body", zap.Error(err))
		return fmt.Errorf("failed to read response body: %w", err) // Return error if reading body fails
	}
=======
	internalServiceSecret := os.Getenv("PROFILE_MANAGER_SERVICE_SECRET")
	if internalServiceSecret == "" {
		return fmt.Errorf("PROFILE_MANAGER_SERVICE_SECRET environment variable is not set for internal communication")
	}
	httpReq.Header.Set("X-Service-Secret", internalServiceSecret) 
	utils.Log.Info("ProfileManagerHTTPClient: Sending logout request to Profile Manager",
		zap.String("url", c.baseURL+"/auth/logout"),
		zap.String("token_prefix", token[:utils.Min(len(token), 10)]),
	)
		resp, err := c.client.Do(httpReq)
		if err != nil {
			utils.Log.Error("ProfileManagerHTTPClient: Error sending logout request", zap.Error(err))
			if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) {
				return fmt.Errorf("%w: timeout connecting to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
			}
			if errors.Is(err, syscall.ECONNREFUSED) {
				return fmt.Errorf("%w: connection refused to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
			}
			return fmt.Errorf("failed to send logout request to profile manager: %w", err)
		}
		defer resp.Body.Close()
		utils.Log.Info("ProfileManagerHTTPClient: Received response from Profile Manager", zap.Int("status", resp.StatusCode), zap.String("token_prefix", token[:utils.Min(len(token), 10)]))
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			utils.Log.Error("Failed to read profile manager logout response body", zap.Error(err))
			return fmt.Errorf("failed to read response body: %w", err)
		}
>>>>>>> parnaz-changes

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			utils.Log.Error("Profile Manager returned error response for logout", zap.Int("status", resp.StatusCode), zap.String("message", errorResp.Message), zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusUnauthorized {
<<<<<<< HEAD
				return fmt.Errorf("%w: %s", service.ErrInvalidCredentials, errorResp.Message) // Use ErrInvalidCredentials
=======
				return fmt.Errorf("%w: %s", service.ErrInvalidCredentials, errorResp.Message)
>>>>>>> parnaz-changes
			}
			return fmt.Errorf("profile manager logout failed: %s (%d)", errorResp.Message, resp.StatusCode)
		} else {
			utils.Log.Error("Profile Manager returned unexpected error status for logout", zap.Int("status", resp.StatusCode), zap.ByteString("raw_body", respBody))
			if resp.StatusCode == http.StatusUnauthorized {
				return fmt.Errorf("%w: invalid or expired token", service.ErrInvalidCredentials)
			}
			return fmt.Errorf("profile manager logout failed with status %d: %s", resp.StatusCode, string(respBody))
		}
	}

	return nil
}

<<<<<<< HEAD
// --- New methods to implement based on the ProfileManagerClient interface ---

func (c *profileManagerHTTPClient) RequestPasswordReset(email string) error {
	// Implement HTTP request to Profile Manager's /auth/password/request-reset endpoint
=======
func (c *profileManagerHTTPClient) RequestPasswordReset(email string) error {

>>>>>>> parnaz-changes
	reqBody := map[string]string{"email": email}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request password reset body: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/password/request-reset", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create password reset request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send password reset request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read password reset response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			utils.Log.Error("Profile Manager returned error response for password reset", zap.Int("status", resp.StatusCode), zap.String("message", errorResp.Message), zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusNotFound {
				return fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return fmt.Errorf("profile manager password reset request failed: %s (%d)", errorResp.Message, resp.StatusCode)
		} else {
			utils.Log.Error("Profile Manager returned unexpected error status for password reset", zap.Int("status", resp.StatusCode), zap.ByteString("raw_body", respBody))
			return fmt.Errorf("profile manager password reset request failed with status %d: %s", resp.StatusCode, string(respBody))
		}
	}
	return nil
}

func (c *profileManagerHTTPClient) ResetPassword(token, newPassword string) error {
<<<<<<< HEAD
	// Implement HTTP request to Profile Manager's /auth/password/reset endpoint
	reqBody := model.ResetPasswordRequest{Token: token, NewPassword: newPassword}
=======

	reqBody := model.ResetPasswordRequest{Token: token, NewPassword: newPassword}
	
>>>>>>> parnaz-changes
	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal reset password body: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/password/reset", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create reset password request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send reset password request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read reset password response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			utils.Log.Error("Profile Manager returned error response for reset password", zap.Int("status", resp.StatusCode), zap.String("message", errorResp.Message), zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusUnauthorized { // Assuming 401 for invalid/expired token
				return fmt.Errorf("%w: %s", service.ErrInvalidToken, errorResp.Message)
			}
			return fmt.Errorf("profile manager reset password failed: %s (%d)", errorResp.Message, resp.StatusCode)
		} else {
			utils.Log.Error("Profile Manager returned unexpected error status for reset password", zap.Int("status", resp.StatusCode), zap.ByteString("raw_body", respBody))
			return fmt.Errorf("profile manager reset password failed with status %d: %s", resp.StatusCode, string(respBody))
		}
	}
	return nil
}

func (c *profileManagerHTTPClient) VerifyTwoFACode(username, code string) (*model.User, string, *model.CustomClaims, error) {
	// This is typically part of the login flow, often requiring a temporary session token or similar
	// along with the username for context. Assuming for now, just username and code are passed.
	reqBody := model.VerifyTwoFARequest{Code: code}
	// If Profile Manager needs the username in the body, include it:
	// reqBody := map[string]string{"username": username, "code": code}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to marshal 2FA verification request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/auth/2fa/verify", bytes.NewBuffer(body))
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to create 2FA verification request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// Potentially add a temporary session token header here if Profile Manager's 2FA flow requires it.
	// E.g., httpReq.Header.Set("X-Temp-Auth-Token", tempToken)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return nil, "", nil, fmt.Errorf("%w: cannot connect to profile manager service at %s", service.ErrProfileManagerDown, c.baseURL)
		}
		return nil, "", nil, fmt.Errorf("failed to send 2FA verification request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", nil, fmt.Errorf("failed to read 2FA verification response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			utils.Log.Error("Profile Manager returned error response for 2FA verification", zap.Int("status", resp.StatusCode), zap.String("message", errorResp.Message), zap.String("details", errorResp.Details))
			if resp.StatusCode == http.StatusUnauthorized { // Assuming 401 for invalid 2FA code
				return nil, "", nil, fmt.Errorf("%w: %s", service.ErrInvalidTwoFACode, errorResp.Message)
			}
			return nil, "", nil, fmt.Errorf("profile manager 2FA verification failed: %s (%d)", errorResp.Message, resp.StatusCode)
		} else {
			utils.Log.Error("Profile Manager returned unexpected error status for 2FA verification", zap.Int("status", resp.StatusCode), zap.ByteString("raw_body", respBody))
			return nil, "", nil, fmt.Errorf("profile manager 2FA verification failed with status %d: %s", resp.StatusCode, string(respBody))
		}
	}

	var authResp model.AuthResponse
	if err := json.Unmarshal(respBody, &authResp); err != nil {
		return nil, "", nil, fmt.Errorf("failed to unmarshal 2FA verification response: %w, raw: %s", err, string(respBody))
	}

	if authResp.User == nil || authResp.User.ID == "" {
		return nil, "", nil, errors.New("profile manager did not return complete user details after 2FA verification")
	}

	claims := &model.CustomClaims{
		UserID:   authResp.User.ID,
		Username: authResp.User.Username,
		Roles:    authResp.User.Roles,
	}

	return authResp.User, authResp.Token, claims, nil
}

// --- Account Management Implementations ---

func (c *profileManagerHTTPClient) ChangeUsername(userID string, req model.ChangeUsernameRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal change username request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/change-username", c.baseURL, userID), bytes.NewBuffer(body)) // Example path: /account/{userID}/change-username
	if err != nil {
		return fmt.Errorf("failed to create change username request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// IMPORTANT: Add Authorization header received from API Gateway client or an internal token if used
	// httpReq.Header.Set("Authorization", "Bearer " + getInternalTokenForProfileManager())

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("%w: failed to send change username request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read change username response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			return fmt.Errorf("profile manager change username failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return fmt.Errorf("profile manager change username failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *profileManagerHTTPClient) ChangePassword(userID string, req model.ChangePasswordRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal change password request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/change-password", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create change password request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// IMPORTANT: Add Authorization header
	// httpReq.Header.Set("Authorization", "Bearer " + getInternalTokenForProfileManager())

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("%w: failed to send change password request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read change password response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			return fmt.Errorf("profile manager change password failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return fmt.Errorf("profile manager change password failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *profileManagerHTTPClient) UploadProfilePicture(userID string, filename string, contentType string, fileContent []byte) error {
	// This is a more complex implementation as it involves multipart/form-data.
	// You would typically build a multipart form for the request.

	// For simplicity, let's assume the Profile Manager has a direct endpoint that accepts raw file content
	// or you'd use a dedicated multipart form builder.

	// Example with direct byte stream (simplified, might not fit actual Profile Manager API)
	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/profile-picture", c.baseURL, userID), bytes.NewBuffer(fileContent))
	if err != nil {
		return fmt.Errorf("failed to create upload profile picture request: %w", err)
	}
	httpReq.Header.Set("Content-Type", contentType) // E.g., "image/jpeg"
	httpReq.Header.Set("X-Filename", filename)      // Custom header for filename
	// IMPORTANT: Add Authorization header
	// httpReq.Header.Set("Authorization", "Bearer " + getInternalTokenForProfileManager())

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("%w: failed to send upload profile picture request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read upload profile picture response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			return fmt.Errorf("profile manager upload profile picture failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return fmt.Errorf("profile manager upload profile picture failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *profileManagerHTTPClient) GenerateTwoFASetup(userID string) (secret string, qrCode string, err error) {
	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/2fa/generate-secret", c.baseURL, userID), nil)
	if err != nil {
		return "", "", fmt.Errorf("failed to create generate 2FA secret request: %w", err)
	}
	// IMPORTANT: Add Authorization header
	// httpReq.Header.Set("Authorization", "Bearer " + getInternalTokenForProfileManager())

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return "", "", fmt.Errorf("%w: failed to send generate 2FA secret request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("failed to read generate 2FA secret response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			return "", "", fmt.Errorf("profile manager generate 2FA secret failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return "", "", fmt.Errorf("profile manager generate 2FA secret failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var response struct { // Assuming Profile Manager returns this structure
		Secret string `json:"secret"`
		QRCode string `json:"qr_code"`
	}
	if err := json.Unmarshal(respBody, &response); err != nil {
		return "", "", fmt.Errorf("failed to unmarshal generate 2FA secret response: %w, raw: %s", err, string(respBody))
	}

	return response.Secret, response.QRCode, nil
}

func (c *profileManagerHTTPClient) VerifyAndEnableTwoFA(userID string, req model.VerifyTwoFARequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal verify and enable 2FA request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/2fa/enable", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create verify and enable 2FA request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// IMPORTANT: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("%w: failed to send verify and enable 2FA request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read verify and enable 2FA response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			return fmt.Errorf("profile manager verify and enable 2FA failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return fmt.Errorf("profile manager verify and enable 2FA failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *profileManagerHTTPClient) DisableTwoFA(userID string, req model.DisableTwoFARequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal disable 2FA request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/account/%s/2fa/disable", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create disable 2FA request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// IMPORTANT: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("%w: failed to send disable 2FA request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read disable 2FA response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			return fmt.Errorf("profile manager disable 2FA failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return fmt.Errorf("profile manager disable 2FA failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

// --- User Management Implementations ---

func (c *profileManagerHTTPClient) GetUsers() ([]model.User, error) {
	httpReq, err := http.NewRequest(http.MethodGet, c.baseURL+"/users", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create get users request: %w", err)
	}
	// IMPORTANT: Add Authorization header for admin access

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to send get users request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read get users response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			return nil, fmt.Errorf("profile manager get users failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return nil, fmt.Errorf("profile manager get users failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var users []model.User
	if err := json.Unmarshal(respBody, &users); err != nil {
		return nil, fmt.Errorf("failed to unmarshal get users response: %w, raw: %s", err, string(respBody))
	}
	return users, nil
}

func (c *profileManagerHTTPClient) GetUserByID(userID string) (*model.User, error) {
	httpReq, err := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/users/%s", c.baseURL, userID), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create get user by ID request: %w", err)
	}
	// IMPORTANT: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to send get user by ID request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read get user by ID response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			if resp.StatusCode == http.StatusNotFound {
				return nil, fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return nil, fmt.Errorf("profile manager get user by ID failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return nil, fmt.Errorf("profile manager get user by ID failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var user model.User
	if err := json.Unmarshal(respBody, &user); err != nil {
		return nil, fmt.Errorf("failed to unmarshal get user by ID response: %w, raw: %s", err, string(respBody))
	}
	return &user, nil
}

func (c *profileManagerHTTPClient) CreateUser(req model.RegisterRequest) (*model.User, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal create user request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/users", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create create user request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// IMPORTANT: Add Authorization header for admin access

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to send create user request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read create user response body: %w", err)
	}

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			if resp.StatusCode == http.StatusConflict {
				return nil, fmt.Errorf("%w: %s", service.ErrUserAlreadyExists, errorResp.Message)
			}
			return nil, fmt.Errorf("profile manager create user failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return nil, fmt.Errorf("profile manager create user failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var user model.User
	if err := json.Unmarshal(respBody, &user); err != nil {
		return nil, fmt.Errorf("failed to unmarshal create user response: %w, raw: %s", err, string(respBody))
	}
	return &user, nil
}

func (c *profileManagerHTTPClient) UpdateUser(userID string, req model.User) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal update user request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/users/%s", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create update user request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// IMPORTANT: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("%w: failed to send update user request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read update user response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			if resp.StatusCode == http.StatusNotFound {
				return fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return fmt.Errorf("profile manager update user failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return fmt.Errorf("profile manager update user failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *profileManagerHTTPClient) DeleteUser(userID string) error {
	httpReq, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/users/%s", c.baseURL, userID), nil)
	if err != nil {
		return fmt.Errorf("failed to create delete user request: %w", err)
	}
	// IMPORTANT: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("%w: failed to send delete user request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read delete user response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			if resp.StatusCode == http.StatusNotFound {
				return fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return fmt.Errorf("profile manager delete user failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return fmt.Errorf("profile manager delete user failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *profileManagerHTTPClient) UpdateUserRoles(userID string, roles []string) error {
	reqBody := model.UpdateUserRolesRequest{Roles: roles} // Assuming you have this model
	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal update user roles request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/users/%s/roles", c.baseURL, userID), bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create update user roles request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	// IMPORTANT: Add Authorization header

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("%w: failed to send update user roles request to profile manager: %w", service.ErrProfileManagerDown, err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read update user roles response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp model.ErrorResponse
		if unmarshalErr := json.Unmarshal(respBody, &errorResp); unmarshalErr == nil && errorResp.Message != "" {
			if resp.StatusCode == http.StatusNotFound {
				return fmt.Errorf("%w: %s", service.ErrUserNotFound, errorResp.Message)
			}
			return fmt.Errorf("profile manager update user roles failed: %s (%d)", errorResp.Message, resp.StatusCode)
		}
		return fmt.Errorf("profile manager update user roles failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}
