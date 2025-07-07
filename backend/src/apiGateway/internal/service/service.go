package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"gold-api/internal/model"
	"gold-api/internal/utils"
	"io"
	"mime/multipart" // Added for file uploads
	"net/http"
	"os"
	"strings"
	"syscall"
	"time"

	"go.uber.org/zap"
)

var (
	ErrInvalidCredentials           = errors.New("invalid username or password")
	ErrUserNotFound                 = errors.New("user not found")
	ErrUserAlreadyExists            = errors.New("user with this username or email already exists")
	ErrInternalService              = errors.New("internal service error")
	ErrProfileManagerDown           = errors.New("profile manager service is unavailable")
	ErrTokenNotFound                = errors.New("authentication token not found")
	ErrTwoFARequiredAG              = errors.New("2FA code required by API Gateway")
	ErrBadRequestFromProfileManager = errors.New("bad request from profile manager")
	ErrFileRejectedByProfileManager = errors.New("file rejected by profile manager")
)

type ProfileManagerClient interface {
	RegisterUser(req model.RegisterRequest) error
	// AuthenticateUser signature changed
	AuthenticateUser(req model.LoginRequest) (user *model.User, token string, exp int64, twoFARequired bool, userIDFor2FA string, err error)
	LogoutUser(token string) error
	RequestPasswordReset(req model.RequestPasswordResetRequest) error
	PerformPasswordReset(req model.ResetPasswordRequest) error
	ChangeUsername(req model.ChangeUsernameRequest, userToken string) error
	ChangePassword(req model.ChangePasswordRequest, userToken string) error

	// New 2FA methods
	GenerateTwoFASetup(userToken string) (*model.GenerateTwoFAResponseAG, error)
	VerifyAndEnableTwoFA(req model.VerifyTwoFARequestAG, userToken string) (*model.EnableTwoFAResponseAG, error)
	DisableTwoFA(req model.DisableTwoFARequestAG, userToken string) error
	LoginTwoFA(req model.LoginTwoFARequestAG) (user *model.User, token string, exp int64, err error)
	UploadProfilePicture(fileHeader *multipart.FileHeader, userToken string) (string, error) // Returns the new profile picture URL
	// +++ START OF CHANGE +++
	VerifyToken(token string) error
	// +++ END OF CHANGE +++
}

// VerifyAndEnableTwoFA sends the 2FA code and user's password to the profile manager to verify and enable 2FA.
func (c *profileManagerHTTPClient) VerifyAndEnableTwoFA(req model.VerifyTwoFARequestAG, userToken string) (*model.EnableTwoFAResponseAG, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal verify 2FA request for profile manager: %w", err)
	}

	// ##### START OF FIX #####
	// The URL was changed from "/account/2fa/verify" to "/account/2fa/enable"
	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/account/2fa/enable", bytes.NewBuffer(body))
	// ##### END OF FIX #####
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request for profile manager verify 2FA: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+userToken)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: cannot connect to profile manager for verify 2FA at %s", ErrProfileManagerDown, c.baseURL)
		}
		return nil, fmt.Errorf("failed to send verify 2FA request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read profile manager verify 2FA response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		// Handle specific errors, e.g., invalid 2FA code, incorrect password, or 2FA already enabled.
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusConflict {
			utils.Log.Warn("profileManagerHTTPClient.VerifyAndEnableTwoFA: Profile manager rejected request", zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
			return nil, fmt.Errorf("profile manager rejected verify 2FA request (status %d): %s", resp.StatusCode, string(respBody))
		}
		utils.Log.Error("profileManagerHTTPClient.VerifyAndEnableTwoFA: Profile manager returned non-OK status", zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		return nil, fmt.Errorf("profile manager verify 2FA failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var enableResp model.EnableTwoFAResponseAG
	if err := json.Unmarshal(respBody, &enableResp); err != nil {
		return nil, fmt.Errorf("failed to decode profile manager verify 2FA success response: %w, body: %s", err, string(respBody))
	}
	// The response might include recovery codes, which should be handled by the caller.
	return &enableResp, nil
}

// LoginTwoFA sends the 2FA code to the profile manager to complete login.
func (c *profileManagerHTTPClient) LoginTwoFA(req model.LoginTwoFARequestAG) (user *model.User, token string, exp int64, err error) {
	body, errMars := json.Marshal(req)
	if errMars != nil {
		return nil, "", 0, fmt.Errorf("failed to marshal 2FA login request: %w", errMars)
	}

	httpReq, errHttpReq := http.NewRequest(http.MethodPost, c.baseURL+"/login/2fa", bytes.NewBuffer(body))
	if errHttpReq != nil {
		return nil, "", 0, fmt.Errorf("failed to create HTTP request for 2FA login: %w", errHttpReq)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, errDo := c.client.Do(httpReq)
	if errDo != nil {
		if errors.Is(errDo, context.DeadlineExceeded) || errors.Is(errDo, os.ErrDeadlineExceeded) || errors.Is(errDo, syscall.ECONNREFUSED) {
			return nil, "", 0, fmt.Errorf("%w: cannot connect to profile manager service at %s for 2FA login: %v", ErrProfileManagerDown, c.baseURL, errDo)
		}
		return nil, "", 0, fmt.Errorf("failed to send 2FA login request to profile manager: %w", errDo)
	}
	defer resp.Body.Close()

	respBody, errRead := io.ReadAll(resp.Body)
	if errRead != nil {
		return nil, "", 0, fmt.Errorf("failed to read 2FA login response body: %w", errRead)
	}

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized { // Invalid 2FA code or other auth issue
			return nil, "", 0, fmt.Errorf("%w: invalid 2FA code or credentials: %s", ErrInvalidCredentials, string(respBody))
		}
		if resp.StatusCode == http.StatusNotFound { // User ID for 2FA not found or session expired
			return nil, "", 0, fmt.Errorf("%w: user not found or 2FA session expired: %s", ErrUserNotFound, string(respBody))
		}
		return nil, "", 0, fmt.Errorf("profileManager 2FA login failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	// Expecting a final AuthResponse after successful 2FA login
	var authResp model.AuthResponse
	if errJson := json.Unmarshal(respBody, &authResp); errJson != nil {
		return nil, "", 0, fmt.Errorf("failed to unmarshal AuthResponse from profile manager after 2FA: %w, body: %s", errJson, string(respBody))
	}
	if authResp.User == nil {
		return nil, "", 0, errors.New("profile manager 2FA login success but no user details provided")
	}
	return authResp.User, authResp.Token, authResp.Exp, nil
}

// GenerateTwoFASetup requests 2FA setup details (QR code, secret) from the profile manager.
func (c *profileManagerHTTPClient) GenerateTwoFASetup(userToken string) (*model.GenerateTwoFAResponseAG, error) {
	// ##### START OF FIX #####
	// The URL was changed from "/account/2fa/setup" to "/account/2fa/generate-secret"
	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/account/2fa/generate-secret", nil) // No body needed for setup generation
	// ##### END OF FIX #####
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request for profile manager 2FA setup: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+userToken)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return nil, fmt.Errorf("%w: cannot connect to profile manager for 2FA setup at %s", ErrProfileManagerDown, c.baseURL)
		}
		return nil, fmt.Errorf("failed to send 2FA setup request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read profile manager 2FA setup response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		// Handle specific errors, e.g., if 2FA is already enabled or user not found
		if resp.StatusCode == http.StatusConflict || resp.StatusCode == http.StatusBadRequest {
			utils.Log.Warn("profileManagerHTTPClient.GenerateTwoFASetup: Profile manager rejected request", zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
			return nil, fmt.Errorf("profile manager rejected 2FA setup request (status %d): %s", resp.StatusCode, string(respBody))
		}
		utils.Log.Error("profileManagerHTTPClient.GenerateTwoFASetup: Profile manager returned non-OK status", zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		return nil, fmt.Errorf("profile manager 2FA setup failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var setupResp model.GenerateTwoFAResponseAG
	if err := json.Unmarshal(respBody, &setupResp); err != nil {
		return nil, fmt.Errorf("failed to decode profile manager 2FA setup success response: %w, body: %s", err, string(respBody))
	}
	return &setupResp, nil
}

// DisableTwoFA sends a request to the profile manager to disable 2FA for the user.
func (c *profileManagerHTTPClient) DisableTwoFA(req model.DisableTwoFARequestAG, userToken string) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal disable 2FA request for profile manager: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/account/2fa/disable", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to create HTTP request for profile manager disable 2FA: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+userToken)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return fmt.Errorf("%w: cannot connect to profile manager for disable 2FA at %s", ErrProfileManagerDown, c.baseURL)
		}
		return fmt.Errorf("failed to send disable 2FA request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		// Handle specific errors, e.g., if 2FA was not enabled or password was incorrect
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusBadRequest {
			utils.Log.Warn("profileManagerHTTPClient.DisableTwoFA: Profile manager rejected request", zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
			return fmt.Errorf("profile manager rejected disable 2FA request (status %d): %s", resp.StatusCode, string(respBody))
		}
		utils.Log.Error("profileManagerHTTPClient.DisableTwoFA: Profile manager returned non-OK status", zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		return fmt.Errorf("profile manager disable 2FA failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
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

// LoginUser signature and logic modified
func (s *AuthService) LoginUser(username, password string) (user *model.User, token string, exp int64, twoFARequired bool, userIDFor2FA string, err error) {
	req := model.LoginRequest{Username: username, Password: password}
	utils.Log.Info("Attempting to authenticate user via Profile Manager", zap.String("username", username))

	// Call the modified client.AuthenticateUser
	u, t, e, is2FAReq, uid2FA, authErr := s.profileMgrClient.AuthenticateUser(req)
	if authErr != nil {
		utils.Log.Error("Authentication failed in ProfileManagerClient", zap.String("username", username), zap.Error(authErr))
		// Specific error checks remain useful
		if errors.Is(authErr, ErrInvalidCredentials) {
			return nil, "", 0, false, "", ErrInvalidCredentials
		}
		if errors.Is(authErr, ErrProfileManagerDown) {
			return nil, "", 0, false, "", ErrProfileManagerDown
		}
		return nil, "", 0, false, "", fmt.Errorf("%w: %v", ErrInternalService, authErr)
	}

	if is2FAReq {
		utils.Log.Info("2FA required for user", zap.String("username", username), zap.String("userIDFor2FA", uid2FA))
		return nil, "", 0, true, uid2FA, ErrTwoFARequiredAG // Or simply return nil error if ErrTwoFARequiredAG is the signal
	}

	utils.Log.Info("User authenticated successfully by Profile Manager", zap.String("username", u.Username), zap.String("role", u.Role))
	return u, t, e, false, "", nil
}

// LoginTwoFA completes the 2FA login process by calling the profile manager.
func (s *AuthService) LoginTwoFA(req model.LoginTwoFARequestAG) (user *model.User, token string, exp int64, err error) {
	utils.Log.Info("Attempting to complete 2FA login via Profile Manager", zap.String("userID", req.UserID))
	u, t, e, authErr := s.profileMgrClient.LoginTwoFA(req)
	if authErr != nil {
		utils.Log.Error("2FA Login failed in ProfileManagerClient", zap.String("userID", req.UserID), zap.Error(authErr))
		if errors.Is(authErr, ErrInvalidCredentials) {
			return nil, "", 0, ErrInvalidCredentials
		}
		if errors.Is(authErr, ErrUserNotFound) { // Or other specific errors from client
			return nil, "", 0, ErrUserNotFound
		}
		if errors.Is(authErr, ErrProfileManagerDown) {
			return nil, "", 0, ErrProfileManagerDown
		}
		return nil, "", 0, fmt.Errorf("%w: %v", ErrInternalService, authErr)
	}
	utils.Log.Info("User authenticated successfully with 2FA by Profile Manager", zap.String("userID", u.Id))
	return u, t, e, nil
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

func (c *profileManagerHTTPClient) UploadProfilePicture(fileHeader *multipart.FileHeader, userToken string) (string, error) {
	// Create a pipe to stream the file content
	pr, pw := io.Pipe()
	// Create a new multipart writer with the pipe reader
	writer := multipart.NewWriter(pw)

	// Create a goroutine to write the file content to the pipe
	go func() {
		defer pw.Close()     // Close the writer side of the pipe
		defer writer.Close() // Close the multipart writer

		part, err := writer.CreateFormFile("profile_picture", fileHeader.Filename)
		if err != nil {
			utils.Log.Error("profileManagerHTTPClient.UploadProfilePicture: CreateFormFile error", zap.Error(err))
			pw.CloseWithError(err) // Close pipe with error
			return
		}

		srcFile, err := fileHeader.Open()
		if err != nil {
			utils.Log.Error("profileManagerHTTPClient.UploadProfilePicture: Open source file error", zap.Error(err))
			pw.CloseWithError(err)
			return
		}
		defer srcFile.Close()

		if _, err := io.Copy(part, srcFile); err != nil {
			utils.Log.Error("profileManagerHTTPClient.UploadProfilePicture: Copy file to part error", zap.Error(err))
			pw.CloseWithError(err)
			return
		}
	}()

	httpReq, err := http.NewRequest(http.MethodPost, c.baseURL+"/account/profile-picture", pr)
	if err != nil {
		return "", fmt.Errorf("failed to create HTTP request for profile picture upload: %w", err)
	}
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())
	httpReq.Header.Set("Authorization", "Bearer "+userToken)

	resp, err := c.client.Do(httpReq)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || errors.Is(err, syscall.ECONNREFUSED) {
			return "", fmt.Errorf("%w: cannot connect to profile manager for picture upload at %s", ErrProfileManagerDown, c.baseURL)
		}
		return "", fmt.Errorf("failed to send profile picture upload request to profile manager: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read profile picture upload response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusRequestEntityTooLarge {
			utils.Log.Warn("profileManagerHTTPClient.UploadProfilePicture: Profile manager rejected file", zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
			// Return a specific error type that handlers can check with errors.Is()
			return "", fmt.Errorf("%w: (status %d): %s", ErrFileRejectedByProfileManager, resp.StatusCode, string(respBody))
		}
		utils.Log.Error("profileManagerHTTPClient.UploadProfilePicture: Profile manager returned non-OK status", zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		return "", fmt.Errorf("profile manager picture upload failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var successResp struct {
		Message           string `json:"message"`
		ProfilePictureURL string `json:"profile_picture_url"`
	}
	if err := json.Unmarshal(respBody, &successResp); err != nil {
		return "", fmt.Errorf("failed to decode profile picture upload success response: %w", err)
	}
	return successResp.ProfilePictureURL, nil
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
			utils.Log.Warn("profileManagerHTTPClient.ChangePassword: Profile manager returned Bad Request status", // Changed to Warn as it's a client error
				zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
			// Return a specific error type
			return fmt.Errorf("%w: %s", ErrBadRequestFromProfileManager, string(respBody))
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
		if errors.Is(err, ErrBadRequestFromProfileManager) || errors.Is(err, ErrInvalidCredentials) {
			return err // Propagate specific errors
		}
		return fmt.Errorf("%w: %v", ErrInternalService, err) // Wrap other errors
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

// AuthenticateUser in profileManagerHTTPClient modified for 2FA
func (c *profileManagerHTTPClient) AuthenticateUser(req model.LoginRequest) (user *model.User, token string, exp int64, twoFARequired bool, userIDFor2FA string, err error) {
	body, errMars := json.Marshal(req)
	if errMars != nil {
		return nil, "", 0, false, "", fmt.Errorf("failed to marshal login request: %w", errMars)
	}

	httpReq, errHttpReq := http.NewRequest(http.MethodPost, c.baseURL+"/login", bytes.NewBuffer(body))
	if errHttpReq != nil {
		return nil, "", 0, false, "", fmt.Errorf("failed to create HTTP request for login: %w", errHttpReq)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, errDo := c.client.Do(httpReq)
	if errDo != nil {
		if errors.Is(errDo, context.DeadlineExceeded) || errors.Is(errDo, os.ErrDeadlineExceeded) || errors.Is(errDo, syscall.ECONNREFUSED) {
			return nil, "", 0, false, "", fmt.Errorf("%w: cannot connect to profile manager service at %s for login: %v", ErrProfileManagerDown, c.baseURL, errDo)
		}
		return nil, "", 0, false, "", fmt.Errorf("failed to send login request to profile manager: %w", errDo)
	}
	defer resp.Body.Close()

	respBody, errRead := io.ReadAll(resp.Body) // Using io.ReadAll
	if errRead != nil {
		return nil, "", 0, false, "", fmt.Errorf("failed to read login response body: %w", errRead)
	}

	if resp.StatusCode == http.StatusOK {
		// Check if this is a 2FA required response or final auth response
		// Assuming profileManager's LoginStep1Response matches the structure we expect.
		var step1Resp struct { // Define anonymous struct matching profileManager's LoginStep1Response
			TwoFARequired bool   `json:"two_fa_required"`
			UserID        string `json:"user_id,omitempty"`
			Message       string `json:"message"`
		}
		if errJson := json.Unmarshal(respBody, &step1Resp); errJson == nil && step1Resp.TwoFARequired {
			return nil, "", 0, true, step1Resp.UserID, nil // Signal 2FA is required
		}

		// If not 2FA step 1, assume it's the final AuthResponse
		var authResp model.AuthResponse
		if errJson := json.Unmarshal(respBody, &authResp); errJson != nil {
			return nil, "", 0, false, "", fmt.Errorf("failed to unmarshal AuthResponse from profile manager: %w, body: %s", errJson, string(respBody))
		}
		if authResp.User == nil { // authResp.User.Id check removed as User itself might be nil
			return nil, "", 0, false, "", errors.New("profile manager login success but no user details provided")
		}
		return authResp.User, authResp.Token, authResp.Exp, false, "", nil
	}

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, "", 0, false, "", fmt.Errorf("%w: %s", ErrInvalidCredentials, string(respBody))
	}
	return nil, "", 0, false, "", fmt.Errorf("profileManager login failed with status %d: %s", resp.StatusCode, string(respBody))
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

	respBody, err := io.ReadAll(resp.Body)
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

	respBody, err := io.ReadAll(resp.Body)
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

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		utils.Log.Error("profileManagerHTTPClient.RequestPasswordReset: Profile manager returned non-OK status",
			zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		if resp.StatusCode >= 500 {
			return fmt.Errorf("profile manager internal error during password reset request (status %d): %s", resp.StatusCode, string(respBody))
		}
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
		respBody, _ := io.ReadAll(resp.Body)
		utils.Log.Error("profileManagerHTTPClient.PerformPasswordReset: Profile manager returned non-OK status",
			zap.Int("status", resp.StatusCode), zap.String("body", string(respBody)))
		if resp.StatusCode == http.StatusBadRequest {
			return fmt.Errorf("%w: invalid token or request: %s", ErrInvalidCredentials, string(respBody))
		}
		return fmt.Errorf("profile manager password reset failed with status %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

// +++ START OF CHANGE +++
// Implement the token verification logic.
func (c *profileManagerHTTPClient) VerifyToken(token string) error {
	// The URL for the new endpoint in profileManager is /api/v1/auth/token/verify
	url := fmt.Sprintf("%s/api/v1/auth/token/verify", c.baseURL)
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return fmt.Errorf("could not create token verification request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.client.Do(req)
	if err != nil {
		// Check for connection errors specifically
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, os.ErrDeadlineExceeded) || strings.Contains(err.Error(), "connect: connection refused") {
			utils.Log.Error("VerifyToken: Profile manager service is unavailable", zap.String("url", url), zap.Error(err))
			return fmt.Errorf("%w: %v", ErrProfileManagerDown, err)
		}
		utils.Log.Error("VerifyToken: Error sending request to profile manager", zap.String("url", url), zap.Error(err))
		return fmt.Errorf("error sending token verification request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		utils.Log.Warn("VerifyToken: Token rejected by profile service",
			zap.Int("status", resp.StatusCode),
			zap.String("url", url),
			zap.String("responseBody", string(respBody)))
		return fmt.Errorf("token was rejected by profile service (status: %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}
// +++ END OF CHANGE +++

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (s *AuthService) Logout(token string) error {
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
		utils.Log.Error("AuthService: RequestPasswordReset failed via ProfileManagerClient", zap.String("email", req.Email), zap.Error(err))
		return ErrInternalService
	}
	return nil
}

func (s *AuthService) PerformPasswordReset(req model.ResetPasswordRequest) error {
	err := s.profileMgrClient.PerformPasswordReset(req)
	if err != nil {
		utils.Log.Error("AuthService: PerformPasswordReset failed via ProfileManagerClient", zap.Error(err))
		if errors.Is(err, ErrInvalidCredentials) {
			return ErrInvalidCredentials
		}
		return ErrInternalService
	}
	return nil
}

func (s *AuthService) UploadProfilePicture(fileHeader *multipart.FileHeader, userToken string) (string, error) {
	newURL, err := s.profileMgrClient.UploadProfilePicture(fileHeader, userToken)
	if err != nil {
		utils.Log.Error("AuthService (apiGateway): UploadProfilePicture failed", zap.Error(err))
		if errors.Is(err, ErrFileRejectedByProfileManager) {
			return "", err
		}
		return "", ErrInternalService
	}
	return newURL, nil
}

func (s *AuthService) GenerateTwoFASetup(userToken string) (*model.GenerateTwoFAResponseAG, error) {
	utils.Log.Info("AuthService: Forwarding GenerateTwoFASetup request to ProfileManagerClient")
	res, err := s.profileMgrClient.GenerateTwoFASetup(userToken)
	if err != nil {
		utils.Log.Error("AuthService: GenerateTwoFASetup failed via ProfileManagerClient", zap.Error(err))
		return nil, err
	}
	if res == nil {
		utils.Log.Error("AuthService: GenerateTwoFASetup received nil response from client without an error")
		return nil, errors.New("internal server error: received unexpected nil response")
	}
	return res, nil
}

func (s *AuthService) VerifyAndEnableTwoFA(req model.VerifyTwoFARequestAG, userToken string) (*model.EnableTwoFAResponseAG, error) {
	utils.Log.Info("AuthService: Forwarding VerifyAndEnableTwoFA request to ProfileManagerClient")
	res, err := s.profileMgrClient.VerifyAndEnableTwoFA(req, userToken)
	if err != nil {
		utils.Log.Error("AuthService: VerifyAndEnableTwoFA failed via ProfileManagerClient", zap.Error(err))
		return nil, err
	}
	return res, nil
}

func (s *AuthService) DisableTwoFA(req model.DisableTwoFARequestAG, userToken string) error {
	utils.Log.Info("AuthService: Forwarding DisableTwoFA request to ProfileManagerClient")
	err := s.profileMgrClient.DisableTwoFA(req, userToken)
	if err != nil {
		utils.Log.Error("AuthService: DisableTwoFA failed via ProfileManagerClient", zap.Error(err))
		return err
	}
	return nil
}

func IsValidEmail(email string) bool {
	if len(email) < 3 || len(email) > 254 {
		return false
	}
	at := strings.Index(email, "@")
	dot := strings.LastIndex(email, ".")
	return at > 0 && dot > at+1 && dot < len(email)-1
}