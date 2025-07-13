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

type AuthService struct {
    profileMgrClient profilemanager.ProfileManagerClient
}

func NewAuthService(client profilemanager.ProfileManagerClient) (*AuthService, error) { 
    if client == nil {
        utils.Log.Fatal("ProfileManagerClient cannot be nil for AuthService.")
    }
    return &AuthService{profileMgrClient: client}, nil // 👈 Return nil for error on success
	
}

func (s *AuthService) LoginUser(username, password string) (*model.User, string, *model.CustomClaims, error) {
	user, token, claims, err := s.profileMgrClient.AuthenticateUser(username, password)
	if err != nil {
		utils.Log.Error("Authentication failed in ProfileManagerClient", zap.String("username", username), zap.Error(err))
		if errors.Is(err, service.ErrInvalidCredentials) {
			return nil, "", nil, service.ErrInvalidCredentials
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return nil, "", nil, service.ErrProfileManagerDown
		}
		return nil, "", nil, fmt.Errorf("%w: failed to authenticate user with profile manager", service.ErrInternalService)
	}

	utils.Log.Info("User authenticated successfully by Profile Manager",
		zap.String("username", user.Username),
		zap.Any("roles", user.Roles),
	)
	return user, token, claims, nil
}

func (s *AuthService) RegisterUser(req model.RegisterRequest) error {
	err := s.profileMgrClient.RegisterUser(req)
	if err != nil {
		utils.Log.Error("Registration failed in ProfileManagerClient", zap.String("username", req.Username), zap.Error(err))
		if errors.Is(err, service.ErrUserAlreadyExists) { 
			return service.ErrUserAlreadyExists
		}
		if errors.Is(err, service.ErrProfileManagerDown) { 
			return service.ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to register user with profile manager", service.ErrInternalService)
	}
	utils.Log.Info("User registered successfully by Profile Manager", zap.String("username", req.Username))
	return nil
}

func (s *AuthService) RequestPasswordReset(email string) error {
	err := s.profileMgrClient.RequestPasswordReset(email) // این متد باید در ProfileManagerClient تعریف شود
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return service.ErrUserNotFound
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return service.ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to request password reset from profile manager", service.ErrInternalService)
	}
	return nil
}

func (s *AuthService) ResetPassword(token, newPassword string) error {
	err := s.profileMgrClient.ResetPassword(token, newPassword) // این متد باید در ProfileManagerClient تعریف شود
	if err != nil {
		if errors.Is(err, service.ErrInvalidToken) {
			return service.ErrInvalidToken
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return service.ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to reset password via profile manager", service.ErrInternalService)
	}
	return nil
}

func (s *AuthService) LoginTwoFA(username, code string) (*model.User, string, *model.CustomClaims, error) {
	user, token, claims, err := s.profileMgrClient.VerifyTwoFACode(username, code) // این متد باید در ProfileManagerClient تعریف شود
	if err != nil {
		if errors.Is(err, service.ErrInvalidTwoFACode) {
			return nil, "", nil, service.ErrInvalidTwoFACode
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return nil, "", nil, service.ErrProfileManagerDown
		}
		return nil, "", nil, fmt.Errorf("%w: failed to perform 2FA login via profile manager", service.ErrInternalService)
	}
	return user, token, claims, nil
}

func (s *AuthService) LogoutUser(token string) error {
	// ... (همانند قبل، با استفاده از s.profileMgrClient.LogoutUser)
	err := s.profileMgrClient.LogoutUser(token)
	if err != nil {
		utils.Log.Error("Logout failed in ProfileManagerClient", zap.Error(err), zap.String("token_prefix", token[:utils.Min(len(token), 10)])) // استفاده از utils.Min
		if errors.Is(err, service.ErrInvalidCredentials) {
			return service.ErrInvalidCredentials
		}
		if errors.Is(err, service.ErrProfileManagerDown) {
			return service.ErrProfileManagerDown
		}
		return fmt.Errorf("%w: failed to logout user with profile manager", service.ErrInternalService)
	}
	utils.Log.Info("User logout successfully by Profile Manager", zap.String("token_prefix", token[:utils.Min(len(token), 10)]))
	return nil
}

