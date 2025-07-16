package twofa

import (
	"errors"
	"fmt"
	"time"

	"profile-gold/internal/repository/db/postgresDb"
	"profile-gold/internal/utils"

	"github.com/pquerna/otp/totp"
)

type TwoFAService interface {
    GenerateSecret() (string, error)
    GenerateTOTPCode(secret string) (string, error) 
    VerifyTOTPCode(secret, code string) bool        
    GetUser2FASecret(userID string) (string, error)
    SetUser2FASecret(userID, secret string) error
    RemoveUser2FASecret(userID string) error
}

type simpleTwoFAService struct {
    userRepo postgresDb.UserRepository 
}

func NewSimpleTwoFAService(userRepo postgresDb.UserRepository) (TwoFAService, error) {
    if userRepo == nil {
        utils.Log.Error("UserRepository cannot be nil for TwoFAService.")
        return nil, fmt.Errorf("UserRepository cannot be nil for TwoFAService.") 
    }
    return &simpleTwoFAService{
        userRepo: userRepo,
    }, nil
}

func (s *simpleTwoFAService) GenerateSecret() (string, error) {
    key, err := totp.Generate(totp.GenerateOpts{
        Issuer:      "Zarfolio",      
        AccountName: "user@example.com", 
    })
    if err != nil {
        return "", fmt.Errorf("failed to generate 2FA secret: %w", err)
    }
    return key.Secret(), nil
}

func (s *simpleTwoFAService) GenerateTOTPCode(secret string) (string, error) {
    code, err := totp.GenerateCode(secret, time.Now())
    if err != nil {
        return "", fmt.Errorf("failed to generate TOTP code: %w", err)
    }
    return code, nil
}

func (s *simpleTwoFAService) VerifyTOTPCode(secret, code string) bool {
    valid := totp.Validate(code, secret)
    return valid
}

func (s *simpleTwoFAService) GetUser2FASecret(userID string) (string, error) {
    user, err := s.userRepo.GetUserByID(userID) 
    if err != nil {
        return "", fmt.Errorf("failed to get user by ID %s: %w", userID, err)
    }
    if user == nil {
        return "", errors.New("user not found")
    }
    return user.TwoFASecret, nil 
}

func (s *simpleTwoFAService) SetUser2FASecret(userID, secret string) error {
    user, err := s.userRepo.GetUserByID(userID)
    if err != nil {
        return fmt.Errorf("failed to get user by ID %s: %w", userID, err)
    }
    if user == nil {
        return errors.New("user not found")
    }
    user.TwoFASecret = secret
    user.TwoFAEnabled = true 
    err = s.userRepo.UpdateUser(user) 
    if err != nil {
        return fmt.Errorf("failed to update user with 2FA secret: %w", err)
    }
    return nil
}

func (s *simpleTwoFAService) RemoveUser2FASecret(userID string) error {
    user, err := s.userRepo.GetUserByID(userID)
    if err != nil {
        return fmt.Errorf("failed to get user by ID %s: %w", userID, err)
    }
    if user == nil {
        return errors.New("user not found")
    }
    user.TwoFASecret = ""
    user.TwoFAEnabled = false
    err = s.userRepo.UpdateUser(user)
    if err != nil {
        return fmt.Errorf("failed to remove 2FA secret from user: %w", err)
    }
    return nil
}