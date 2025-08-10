package auth

import (
	"errors"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	profilemanager "gold-api/internal/service/profilemanger"
	"gold-api/internal/utils"

	"go.uber.org/zap"
)

type AuthService interface {
	LoginUser(username, password string) (*model.User, string, *model.CustomClaims, error)
	RegisterUser(req model.RegisterRequest) error
	LogoutUser(token string) error
	RequestPasswordReset(email string) error
	ResetPassword(token, newPassword string) error
	VerifyTwoFACode(username, code string) (*model.User, string, *model.CustomClaims, error)
}

type AuthServiceImpl struct {
	profileMgrClient profilemanager.ProfileManagerClient
	logger           *zap.Logger
}

func NewAuthService(client profilemanager.ProfileManagerClient, logger *zap.Logger) (AuthService, error) {
	defer logger.Sync() 

	if client == nil {
		logger.Error("ProfileManagerClient passed to NewAuthService is nil",
			zap.String("service", "auth-service"),
			zap.String("operation", "new-auth-service"))
		return nil, fmt.Errorf("ProfileManagerClient cannot be nil for AuthService")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for AuthService")
	}

	logger.Debug("AuthService initialized successfully",
		zap.String("service", "auth-service"),
		zap.String("operation", "new-auth-service"))
	return &AuthServiceImpl{profileMgrClient: client, logger: logger}, nil
}

func (s *AuthServiceImpl) LoginUser(username, password string) (*model.User, string, *model.CustomClaims, error) {
	defer s.logger.Sync()

	user, token, claims, err := s.profileMgrClient.AuthenticateUser(username, password)
	if err != nil {
		s.logger.Error("Authentication failed in ProfileManagerClient",
			zap.String("service", "auth-service"),
			zap.String("operation", "login-user"),
			zap.String("username", username),
			zap.Error(err))
		if errors.Is(err, service.ErrInvalidCredentials) {
			return nil, "", nil, service.ErrInvalidCredentials
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return nil, "", nil, service.ErrProfileManagerDown
		}
		return nil, "", nil, fmt.Errorf("%w: failed to authenticate user with profile manager", service.ErrInternalService)
	}

	s.logger.Debug("User authenticated successfully by Profile Manager",
		zap.String("service", "auth-service"),
		zap.String("operation", "login-user"),
		zap.String("username", user.Username),
		zap.Any("roles", user.Roles))
	return user, token, claims, nil
}

func (s *AuthServiceImpl) RegisterUser(req model.RegisterRequest) error {
	defer s.logger.Sync()

	err := s.profileMgrClient.RegisterUser(req)
	if err != nil {
		s.logger.Error("Registration failed in ProfileManagerClient",
			zap.String("service", "auth-service"),
			zap.String("operation", "register-user"),
			zap.String("username", req.Username),
			zap.Error(err))
		if errors.Is(err, service.ErrUserAlreadyExists) {
			return service.ErrUserAlreadyExists
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return service.ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to register user with profile manager", service.ErrInternalService)
	}

	s.logger.Debug("User registered successfully by Profile Manager",
		zap.String("service", "auth-service"),
		zap.String("operation", "register-user"),
		zap.String("username", req.Username))
	return nil
}

func (s *AuthServiceImpl) RequestPasswordReset(email string) error {
	defer s.logger.Sync()

	err := s.profileMgrClient.RequestPasswordReset(email)
	if err != nil {
		s.logger.Error("Failed to request password reset from Profile Manager",
			zap.String("service", "auth-service"),
			zap.String("operation", "request-password-reset"),
			zap.String("email", email),
			zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return service.ErrUserNotFound
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return service.ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to request password reset from profile manager", service.ErrInternalService)
	}

	s.logger.Debug("Password reset requested successfully",
		zap.String("service", "auth-service"),
		zap.String("operation", "request-password-reset"),
		zap.String("email", email))
	return nil
}

func (s *AuthServiceImpl) ResetPassword(token, newPassword string) error {
	defer s.logger.Sync()

	err := s.profileMgrClient.ResetPassword(token, newPassword)
	if err != nil {
		s.logger.Error("Failed to reset password via Profile Manager",
			zap.String("service", "auth-service"),
			zap.String("operation", "reset-password"),
			zap.String("token_prefix", token[:utils.Min(len(token), 10)]),
			zap.Error(err))
		if errors.Is(err, service.ErrInvalidToken) {
			return service.ErrInvalidToken
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return service.ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to reset password via profile manager", service.ErrInternalService)
	}

	s.logger.Debug("Password reset successfully",
		zap.String("service", "auth-service"),
		zap.String("operation", "reset-password"),
		zap.String("token_prefix", token[:utils.Min(len(token), 10)]))
	return nil
}

func (s *AuthServiceImpl) LogoutUser(token string) error {
	defer s.logger.Sync()

	err := s.profileMgrClient.LogoutUser(token)
	if err != nil {
		s.logger.Error("Logout failed in ProfileManagerClient",
			zap.String("service", "auth-service"),
			zap.String("operation", "logout-user"),
			zap.String("token_prefix", token[:utils.Min(len(token), 10)]),
			zap.Error(err))
		if errors.Is(err, service.ErrInvalidCredentials) {
			return service.ErrInvalidCredentials
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return service.ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to logout user with profile manager", service.ErrInternalService)
	}

	s.logger.Debug("User logged out successfully by Profile Manager",
		zap.String("service", "auth-service"),
		zap.String("operation", "logout-user"),
		zap.String("token_prefix", token[:utils.Min(len(token), 10)]))
	return nil
}

func (s *AuthServiceImpl) VerifyTwoFACode(username, code string) (*model.User, string, *model.CustomClaims, error) {
	defer s.logger.Sync()

	req := model.VerifyTwoFARequest{
		Username: username,
		Code:     code,
	}

	user, token, claims, err := s.profileMgrClient.VerifyTwoFACode(req.Username, req.Code)
	if err != nil {
		s.logger.Error("2FA verification failed in ProfileManagerClient",
			zap.String("service", "auth-service"),
			zap.String("operation", "verify-twofa-code"),
			zap.String("username", username),
			zap.Error(err))
		if errors.Is(err, service.ErrInvalidTwoFACode) {
			return nil, "", nil, service.ErrInvalidTwoFACode
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return nil, "", nil, service.ErrProfileManagerDown
		}
		return nil, "", nil, fmt.Errorf("%w: failed to verify 2FA code with profile manager", service.ErrInternalService)
	}

	s.logger.Debug("User 2FA verified successfully by Profile Manager",
		zap.String("service", "auth-service"),
		zap.String("operation", "verify-twofa-code"),
		zap.String("username", user.Username))
	return user, token, claims, nil
}
