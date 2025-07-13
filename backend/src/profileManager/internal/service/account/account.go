package account

import (
	"errors"
	"fmt"
	"profile-gold/internal/repository/db/postgresDb"
	"profile-gold/internal/service/twofa"
	"profile-gold/internal/utils"

	"go.uber.org/zap"
)

type AccountService interface {
	changeUsername(userID string, newUsername string) error
	changePassword(userID string, oldPassword string, newPassword string) error
	uploadProfilePicture(userID string, pictureData []byte) error
	generateTwoFASetup(userID string) (string, error)
	verifyAndEnableTwoFA(userID string, code string) error
	disableTwoFA(userID string) error
}

type accountService struct {
	userRepo     postgresDb.UserRepository
	twoFAService twofa.TwoFAService
}

func NewAccountService(userRepo postgresDb.UserRepository, twoFAService twofa.TwoFAService) (AccountService, error) {

	if userRepo == nil {
		utils.Log.Error("UserRepository cannot be nil for AccountService.")
		return nil, fmt.Errorf("UserRepository cannot be nil for AccountService.")
	}
	if twoFAService == nil {
		utils.Log.Error("TwoFAService cannot be nil for AccountService.")
		return nil, fmt.Errorf("TwoFAService cannot be nil for AccountService.") 
	}
	utils.Log.Info("AccountService initialized successfully.")
	return &accountService{
		userRepo:     userRepo,
		twoFAService: twoFAService,
	}, nil
}

func (s *accountService) changeUsername(userID string, newUsername string) error {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user for username change: %w", err)
	}
	if user == nil {
		return errors.New("user not found")
	}

	existingUser, err := s.userRepo.GetUserByUsername(newUsername)
	if err != nil && !errors.Is(err, errors.New("user not found")) {
		return fmt.Errorf("failed to check new username availability: %w", err)
	}
	if existingUser != nil {
		return errors.New("username already taken")
	}

	user.Username = newUsername
	err = s.userRepo.UpdateUser(user)
	if err != nil {
		return fmt.Errorf("failed to update username in repository: %w", err)
	}

	utils.Log.Info("Username changed successfully for user", zap.String("userID", userID))
	return nil
}

func (s *accountService) changePassword(userID string, oldPassword string, newPassword string) error {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user for password change: %w", err)
	}
	if user == nil {
		return errors.New("user not found")
	}

	if err := utils.CheckPasswordHash(oldPassword, user.PasswordHash); err != nil {
		return errors.New("invalid old password")
	}

	newHashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}
	user.PasswordHash = newHashedPassword
	err = s.userRepo.UpdateUser(user)
	if err != nil {
		return fmt.Errorf("failed to update password in repository: %w", err)
	}

	utils.Log.Info("Password changed successfully for user", zap.String("userID", userID))
	return nil
}

func (s *accountService) uploadProfilePicture(userID string, pictureData []byte) error {

	if len(pictureData) == 0 {
		return errors.New("picture data is empty")
	}
	if len(pictureData) > 5*1024*1024 {
		return errors.New("picture size exceeds limit (5MB)")
	}
	// TODO: اضافه کردن بررسی نوع فایل (مثلاً JPG/PNG)

	// 2. تصویر را ذخیره کنید. (می‌تواند در S3، فضای ذخیره‌سازی محلی یا دیتابیس باشد)
	// فرض می‌کنیم userRepo متدی برای ذخیره تصویر پروفایل دارد
	err := s.userRepo.UploadProfilePicture(userID, pictureData)
	if err != nil {
		return fmt.Errorf("failed to upload profile picture: %w", err)
	}

	utils.Log.Info("Profile picture uploaded successfully for user ID: %s", zap.String("userID", userID))
	return nil
}

// generateTwoFASetup یک secret برای 2FA تولید می‌کند و آن را برمی‌گرداند.
func (s *accountService) generateTwoFASetup(userID string) (string, error) {
	// 1. یک secret جدید برای 2FA تولید کنید.
	secret, err := s.twoFAService.GenerateSecret()
	if err != nil {
		return "", fmt.Errorf("failed to generate 2FA secret: %w", err)
	}

	// 2. secret را در دیتابیس برای کاربر ذخیره کنید (به عنوان 'pending' یا 'disabled').
	// این secret هنوز فعال نیست تا زمانی که کاربر آن را تأیید کند.
	// (فرض می‌کنیم userRepo متدی برای ذخیره secret 2FA کاربر دارد)
	err = s.userRepo.SetUser2FASecret(userID, secret) // این متد باید در UserRepo باشد
	if err != nil {
		return "", fmt.Errorf("failed to save 2FA secret for user: %w", err)
	}

	utils.Log.Info("2FA setup generated for user ID: %s", zap.String("userID", userID))
	return secret, nil
}

// verifyAndEnableTwoFA کد 2FA را تأیید و 2FA را برای کاربر فعال می‌کند.
func (s *accountService) verifyAndEnableTwoFA(userID string, code string) error {
	// 1. secret 2FA کاربر را از دیتابیس دریافت کنید.
	secret, err := s.userRepo.GetUser2FASecret(userID) // این متد باید در UserRepo باشد
	if err != nil {
		return fmt.Errorf("failed to get 2FA secret for user: %w", err)
	}
	if secret == "" {
		return errors.New("2FA not set up for this user")
	}

	// 2. کد 2FA را با secret تأیید کنید.
	isValid := s.twoFAService.VerifyTOTPCode(secret, code)
	if !isValid {
		return errors.New("invalid 2FA code")
	}

	// 3. 2FA را برای کاربر فعال کنید (فیلد enabled در دیتابیس).
	// (فرض می‌کنیم UserRepo متدی برای فعال/غیرفعال کردن 2FA دارد)
	err = s.userRepo.SetUser2FAStatus(userID, true) // این متد باید در UserRepo باشد
	if err != nil {
		return fmt.Errorf("failed to enable 2FA for user: %w", err)
	}

	utils.Log.Info("2FA successfully enabled for user ID: %s", zap.String("userID", userID))
	return nil
}

// disableTwoFA 2FA را برای کاربر غیرفعال می‌کند.
func (s *accountService) disableTwoFA(userID string) error {
	// 1. 2FA را برای کاربر غیرفعال کنید.
	// (فرض می‌کنیم UserRepo متدی برای فعال/غیرفعال کردن 2FA دارد)
	err := s.userRepo.SetUser2FAStatus(userID, false) // این متد باید در UserRepo باشد
	if err != nil {
		return fmt.Errorf("failed to disable 2FA for user: %w", err)
	}

	// 2. secret 2FA را از دیتابیس حذف کنید (اختیاری، اما توصیه می‌شود).
	err = s.userRepo.RemoveUser2FASecret(userID) // این متد باید در UserRepo باشد
	if err != nil {
		// این یک خطای کشنده نیست، فقط لاگ کنید
		utils.Log.Warn("Failed to remove 2FA secret for user", zap.String("userID", userID), zap.Error(err))
	}

	utils.Log.Info("2FA successfully disabled for user ID: %s", zap.String("userID", userID))
	return nil
}
