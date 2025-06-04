package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"gold-api/internal/model"
	"gold-api/internal/utils"
	"io"
	"net/http"
	"os"
	"strings"
	"syscall"
	"time"

	"go.uber.org/zap"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("user with this username or email already exists")
	ErrInternalService    = errors.New("internal service error")
	ErrProfileManagerDown = errors.New("profile manager service is unavailable")
	ErrTokenNotFound      = errors.New("authentication token not found")
)

type ProfileManagerClient interface {
	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(req model.LoginRequest) (*model.User, string, error)
	LogoutUser(token string) error
	RequestPasswordReset(req model.RequestPasswordResetRequest) error
	PerformPasswordReset(req model.ResetPasswordRequest) error
	ChangeUsername(req model.ChangeUsernameRequest, userToken string) error
	ChangePassword(req model.ChangePasswordRequest, userToken string) error
}

type AuthService struct {
	profileMgrClient ProfileManagerClient
}

func NewAuthService(client ProfileManagerClient) *AuthService {
	if client == nil {
		utils.Log.Fatal("ProfileManagerClient cannot be nil for AuthService.")
	}
	return &AuthService{profileMgrClient: client}
}

func (s *AuthService) LoginUser(username, password string) (*model.User, string, error) {
	req := model.LoginRequest{Username: username, Password: password}
	utils.Log.Info("Attempting to authenticate user via Profile Manager", zap.String("username", username))

	user, token, err := s.profileMgrClient.AuthenticateUser(req)
	if err != nil {
		utils.Log.Error("Authentication failed in ProfileManagerClient", zap.String("username", username), zap.Error(err))
		if errors.Is(err, ErrInvalidCredentials) {
			return nil, "", ErrInvalidCredentials
		}
		if errors.Is(err, ErrProfileManagerDown) {
			return nil, "", ErrProfileManagerDown
		}
		return nil, "", fmt.Errorf("%w: failed to authenticate user with profile manager", ErrInternalService)
	}

	utils.Log.Info("User authenticated successfully by Profile Manager", zap.String("username", user.Username), zap.String("role", user.Role))
	return user, token, nil
}

func (s *AuthService) RegisterUser(req model.RegisterRequest) error {
	err := s.profileMgrClient.RegisterUser(req)
	if err != nil {
		utils.Log.Error("Registration failed in ProfileManagerClient", zap.String("username", req.Username), zap.Error(err))
		if errors.Is(err, ErrUserAlreadyExists) {
			return ErrUserAlreadyExists
		}
		return fmt.Errorf("%w: failed to register user with profile manager", ErrInternalService)
	}
	utils.Log.Info("User registered successfully by Profile Manager", zap.String("username", req.Username))
	return nil
}

func (c *profileManagerHTTPClient) ChangeUsername(req model.ChangeUsernameRequest, userToken string) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal change username request for profile manager: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/account/change-username", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create HTTP request for profile manager change username: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+userToken) // Forward the user's token

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager for change username at %s", ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send change username request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		// Specific error handling based on status codes from profileManager
		if resp.StatusCode == http.StatusUnauthorized { // e.g. Wrong current password
			return fmt.Errorf("%w: %s", ErrInvalidCredentials, string(respBody))
		}
		if resp.StatusCode == http.StatusConflict { // e.g. Username taken
			return fmt.Errorf("%w: %s", ErrUserAlreadyExists, string(respBody)) // Reusing ErrUserAlreadyExists for username taken
		}
		if resp.StatusCode == http.StatusNotFound { // e.g. User not found by ID in profileManager (shouldn't happen if token is valid)
			return fmt.Errorf("%w: %s", ErrUserNotFound, string(respBody))
		}
		utils.Log.Error("profileManagerHTTPClient.ChangeUsername: Profile manager returned non-OK status",
			zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		return fmt.Errorf("profile manager change username failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *profileManagerHTTPClient) ChangePassword(req model.ChangePasswordRequest, userToken string) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal change password request for profile manager: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/account/change-password", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create HTTP request for profile manager change password: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+userToken) // Forward the user's token

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager for change password at %s", ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send change password request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		if resp.StatusCode == http.StatusUnauthorized { // Wrong current password
			return fmt.Errorf("%w: %s", ErrInvalidCredentials, string(respBody))
		}
		if resp.StatusCode == http.StatusBadRequest { // e.g. new password policy violation from profileManager
			utils.Log.Error("profileManagerHTTPClient.ChangePassword: Profile manager returned Bad Request status",
				zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
			return fmt.Errorf("bad request from profile manager for change password (status %d): %s", resp.StatusCode, string(respBody))
		}
		utils.Log.Error("profileManagerHTTPClient.ChangePassword: Profile manager returned non-OK status",
			zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		return fmt.Errorf("profile manager change password failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (s *AuthService) ChangeUsername(req model.ChangeUsernameRequest, userToken string) error {
	err := s.profileMgrClient.ChangeUsername(req, userToken)
	if err != nil {
		// Specific errors are already wrapped by client, or can be checked here
		utils.Log.Error("AuthService (apiGateway): ChangeUsername failed via ProfileManagerClient", zap.Error(err))
		return err // Propagate error from client
	}
	return nil
}

func (s *AuthService) ChangePassword(req model.ChangePasswordRequest, userToken string) error {
	err := s.profileMgrClient.ChangePassword(req, userToken)
	if err != nil {
		utils.Log.Error("AuthService (apiGateway): ChangePassword failed via ProfileManagerClient", zap.Error(err))
		return err // Propagate error from client
	}
	return nil
}

type profileManagerHTTPClient struct {
	baseURL string
	client  *http.Client
}

func NewProfileManagerClient(baseURL string) ProfileManagerClient {
	return &profileManagerHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second}, 
	}
}

func (c *profileManagerHTTPClient) AuthenticateUser(req model.LoginRequest) (*model.User, string, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, "", fmt.Errorf("failed to marshal login request for profile manager: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/login", bytes.NewBuffer(body))
	if err != nil {
		return nil, "", fmt.Errorf("failed to create HTTP request for profile manager login: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return nil, "", fmt.Errorf("%w: cannot connect to profile manager service at %s", ErrProfileManagerDown, c.baseURL)
		}
		return nil, "", fmt.Errorf("failed to send login request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read profile manager login response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized {
			return nil, "", fmt.Errorf("%w: %s", ErrInvalidCredentials, string(respBody))
		}
		return nil, "", fmt.Errorf("profile manager login failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var authResp model.AuthResponse
	if err := json.Unmarshal(respBody, &authResp); err != nil {
		return nil, "", fmt.Errorf("failed to unmarshal profile manager login response: %w, raw: %s", err, string(respBody))
	}

	if authResp.User == nil || authResp.User.Id == "" {
		return nil, "", errors.New("profile manager did not return complete user details")
	}

	return authResp.User, authResp.Token, nil
}

func (c *profileManagerHTTPClient) RegisterUser(req model.RegisterRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal register request for profile manager: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/register", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create HTTP request for profile manager register: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager service at %s", ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send register request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read profile manager register response body: %w", err)
	}

	if resp.StatusCode != http.StatusCreated {
		if resp.StatusCode == http.StatusConflict {
			return fmt.Errorf("%w: %s", ErrUserAlreadyExists, string(respBody))
		}
		return fmt.Errorf("profile manager register failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func (c *profileManagerHTTPClient) LogoutUser(token string) error {
	if token == "" {
		return ErrTokenNotFound
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/logout", nil)
	if err != nil {
		return fmt.Errorf("failed to create HTTP request for profile manager logout: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager service at %s", ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send logout request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read profile manager logout response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized {
			return fmt.Errorf("%w: %s", ErrInvalidCredentials, string(respBody))
		}
		return fmt.Errorf("profile manager logout failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func (c *profileManagerHTTPClient) RequestPasswordReset(req model.RequestPasswordResetRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal request password reset for profile manager: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/password/request-reset", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create HTTP request for profile manager password reset request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager service at %s for password reset request", ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send password reset request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	// Profile manager is expected to return 200 OK even if email not found (to prevent enumeration)
	// or a specific error if something else went wrong.
	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body) // Replaced ioutil.ReadAll
		utils.Log.Error("profileManagerHTTPClient.RequestPasswordReset: Profile manager returned non-OK status",
			zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		// We don't return specific errors like UserNotFound from here to the main handler,
		// as the handler should return a generic success message.
		// If profile manager has an internal error, that should be propagated.
		if resp.StatusCode >= 500 {
			return fmt.Errorf("profile manager internal error during password reset request (status %d): %s", resp.StatusCode, string(respBody))
		}
		// For 4xx errors from profile manager (e.g. bad request if it implements stricter validation), let them pass through
		// but they will likely be caught as a generic internal error by the apiGateway's service layer if not specifically handled.
		// For now, any non-200 from profile manager that isn't a 5xx is treated as an unexpected error.
		return fmt.Errorf("unexpected response from profile manager during password reset request (status %d): %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *profileManagerHTTPClient) PerformPasswordReset(req model.ResetPasswordRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal perform password reset for profile manager: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/password/reset", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create HTTP request for profile manager password reset: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager service at %s for password reset", ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send password reset to profile manager: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body) // Replaced ioutil.ReadAll
		utils.Log.Error("profileManagerHTTPClient.PerformPasswordReset: Profile manager returned non-OK status",
			zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		if resp.StatusCode == http.StatusBadRequest { // Assuming profileManager returns 400 for invalid/expired token
			return fmt.Errorf("%w: invalid token or request: %s", ErrInvalidCredentials, string(respBody)) // Reuse ErrInvalidCredentials or define a new one like ErrPasswordResetFailed
		}
		return fmt.Errorf("profile manager password reset failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

// min is a helper function to ensure we don't slice beyond string length
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (s *AuthService) Logout(token string) error {
	// Use a safe prefix for logging, ensuring not to panic if token is too short
	var tokenPrefix string
	if len(token) > 10 {
		tokenPrefix = token[:10]
	} else {
		tokenPrefix = token
	}
	utils.Log.Info("Attempting to logout user via Profile Manager", zap.String("token_prefix", tokenPrefix))
	err := s.profileMgrClient.LogoutUser(token)
	if err != nil {
		utils.Log.Error("Logout failed in ProfileManagerClient", zap.Error(err), zap.String("token_prefix", tokenPrefix))
		if errors.Is(err, ErrInvalidCredentials) {
			return ErrInvalidCredentials
		}
		if errors.Is(err, ErrProfileManagerDown) {
			return ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to logout user with profile manager", ErrInternalService)
	}
	utils.Log.Info("User logout successfully by Profile Manager", zap.String("token_prefix", tokenPrefix))
	return nil
}

func (s *AuthService) RequestPasswordReset(req model.RequestPasswordResetRequest) error {
	err := s.profileMgrClient.RequestPasswordReset(req)
	if err != nil {
		// The client method should already log details.
		// This layer just propagates the error or a generic one.
		utils.Log.Error("AuthService: RequestPasswordReset failed via ProfileManagerClient", zap.String("email", req.Email), zap.Error(err))
		return ErrInternalService // Or return err directly if it's already well-formed for the handler
	}
	return nil
}

func (s *AuthService) PerformPasswordReset(req model.ResetPasswordRequest) error {
	err := s.profileMgrClient.PerformPasswordReset(req)
	if err != nil {
		utils.Log.Error("AuthService: PerformPasswordReset failed via ProfileManagerClient", zap.Error(err))
		if errors.Is(err, ErrInvalidCredentials) { // Check if client returned this specific error
			return ErrInvalidCredentials
		}
		return ErrInternalService // Or return err
	}
	return nil
}

func IsValidEmail(email string) bool {
	// Simple email validation
	if len(email) < 3 || len(email) > 254 {
		return false
	}
	at := strings.Index(email, "@")
	dot := strings.LastIndex(email, ".")
	return at > 0 && dot > at+1 && dot < len(email)-1
}
