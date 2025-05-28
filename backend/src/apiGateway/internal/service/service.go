package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"gold-api/internal/model"
	"gold-api/internal/utils"
	"io/ioutil"
	"net/http"
	"os"      
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
)

type ProfileManagerClient interface {
	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(req model.LoginRequest) (*model.User, string, error) 
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


type profileManagerHTTPClient struct {
	baseURL string
	client  *http.Client
}

func NewProfileManagerClient(baseURL string) ProfileManagerClient {
	return &profileManagerHTTPClient{
		baseURL: baseURL,
		client:  &http.Client{Timeout: 10 * time.Second}, // Add a timeout for HTTP requests
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
