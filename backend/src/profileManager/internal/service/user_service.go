package service

import (
	"context" // Added for context.Background()
	"errors"
	"fmt"

	// "profile-gold/internal/model" // First occurrence removed
	"encoding/json"                                      // Added for marshaling recovery codes
	"profile-gold/internal/model"                        // Second occurrence kept, or consolidate to one
	"profile-gold/internal/repository/db/postgresDb"     // Corrected import path
	redisdb "profile-gold/internal/repository/db/redisDb"
	"profile-gold/internal/utils" // Added import for strings package
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials        = errors.New("invalid username or password")
	ErrUserNotFound              = errors.New("user not found")
	ErrUserAlreadyExists         = errors.New("user with this username or email already exists")
	ErrInternalService           = errors.New("internal service error")
	ErrPasswordResetTokenInvalid = errors.New("password reset token is invalid or expired")
	ErrUsernameTaken             = errors.New("username is already taken")
	ErrTwoFARequired             = errors.New("2FA code required")
	ErrTwoFAAlreadyEnabled       = errors.New("2FA is already enabled for this account")
	ErrTwoFANotEnabled           = errors.New("2FA is not enabled for this account")
	ErrTwoFAInvalidCode          = errors.New("invalid 2FA code")
	ErrTwoFASecretGeneration     = errors.New("failed to generate 2FA secret")
	ErrTwoFAEnableFailed         = errors.New("failed to enable 2FA")
	ErrTwoFADisableFailed        = errors.New("failed to disable 2FA")
	ErrRecoveryCodeInvalid       = errors.New("invalid recovery code")
	ErrPasswordPolicyViolation   = errors.New("new password does not meet policy requirements")
)

type UserService interface {
	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(username, password string) (*model.User, string, *utils.CustomClaims, error)
	LogoutUser(tokenString string) error
	RequestPasswordReset(email string) (string, error) // Returns token string for now
	ResetPassword(tokenString string, newPassword string) error
	ChangeUsername(userID string, newUsername string, currentPassword string) error
	ChangePassword(userID string, currentPassword string, newPassword string) error

	// 2FA Methods
	GenerateTwoFASetup(userID string) (secret string, qrCodeURL string, err error)
	VerifyAndEnableTwoFA(userID string, totpCode string) (recoveryCodes []string, err error)
	DisableTwoFA(userID string, currentPassword string) error
	VerifyTOTP(userID string, totpCode string) (bool, error)
	GetUserByIDForTokenGeneration(userID string) (*model.User, error)
}

type userService struct {
	userRepo               postgresDb.UserRepository
	tokenRepo              redisdb.TokenRepository
	passwordResetTokenRepo postgresDb.PasswordResetTokenRepository // New field
}

// Modify the signature and body to include PasswordResetTokenRepository
func NewUserService(
	r postgresDb.UserRepository,
	t redisdb.TokenRepository,
	prtr postgresDb.PasswordResetTokenRepository, // New parameter
) UserService {
	if r == nil {
		utils.Log.Fatal("UserRepository cannot be nil for UserService.")
	}
	if t == nil {
		utils.Log.Fatal("TokenRepository cannot be nil for UserService.")
	}
	if prtr == nil { // Check for new repository
		utils.Log.Fatal("PasswordResetTokenRepository cannot be nil for UserService.")
	}
	utils.Log.Info("UserService initialized successfully with UserRepo, TokenRepo, and PasswordResetTokenRepo.")
	return &userService{
		userRepo:               r,
		tokenRepo:              t,
		passwordResetTokenRepo: prtr, // Initialize new field
	}
}

func (s *userService) RegisterUser(req model.RegisterRequest) error {
	// Check for existing username
	_, err := s.userRepo.GetUserByUsername(req.Username)
	if err == nil {
		utils.Log.Warn("RegisterUser: Username already exists", zap.String("username", req.Username))
		return ErrUserAlreadyExists
	}
	if !errors.Is(err, postgresDb.ErrUserNotFound) { // Ensure it's specifically ErrUserNotFound from the correct package
		utils.Log.Error("RegisterUser: Failed to check existing username", zap.String("username", req.Username), zap.Error(err))
		return fmt.Errorf("%w: failed to check existing user by username during registration: %v", ErrInternalService, err)
	}

	// Check for existing email
	_, err = s.userRepo.GetUserByEmail(req.Email)
	if err == nil {
		utils.Log.Warn("RegisterUser: Email already exists", zap.String("email", req.Email))
		return ErrUserAlreadyExists // Return the same error, frontend message is generic
	}
	if !errors.Is(err, postgresDb.ErrUserNotFound) {
		utils.Log.Error("RegisterUser: Failed to check existing email", zap.String("email", req.Email), zap.Error(err))
		return fmt.Errorf("%w: failed to check existing user by email during registration: %v", ErrInternalService, err)
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.Log.Error("Failed to hash password for registration", zap.String("username", req.Username), zap.Error(err))
		return fmt.Errorf("%w: failed to hash password", ErrInternalService)
	}

	newUser := &model.User{
		Username:     req.Username,
		PasswordHash: hashedPassword,
		Email:        req.Email,
		Role:         "user",
	}

	err = s.userRepo.CreateUser(newUser)
	if err != nil {
		utils.Log.Error("Failed to create user in repository", zap.String("username", newUser.Username), zap.Error(err))
		if errors.Is(err, postgresDb.ErrDuplicateUser) {
			utils.Log.Warn("RegisterUser: Duplicate user error from repository", zap.String("username", newUser.Username), zap.Error(err))
			return ErrUserAlreadyExists
		}
		return fmt.Errorf("%w: failed to create user in repository: %v", ErrInternalService, err)
	}

	utils.Log.Info("User registered successfully in service", zap.String("username", newUser.Username))
	return nil
}

func (s *userService) AuthenticateUser(username, password string) (*model.User, string, *utils.CustomClaims, error) {
	user, err := s.userRepo.GetUserByUsername(username)

	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("UserService: Authentication failed - User not found in repo", zap.String("username", username))
			return nil, "", nil, ErrInvalidCredentials
		}

		utils.Log.Error("UserService: Failed to get user by username from repo (DB error)", zap.String("username", username), zap.Error(err))
		return nil, "", nil, fmt.Errorf("%w: failed to retrieve user from repository", ErrInternalService)
	}

	if user == nil {
		utils.Log.Fatal("UserService: GetUserByUsername returned a nil user object without an error. This is an unexpected state from the repository.", zap.String("username", username))
		return nil, "", nil, fmt.Errorf("%w: unexpected nil user object from repository", ErrInternalService)
	}

	err = utils.CheckPasswordHash(password, user.PasswordHash)
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, "", nil, ErrInvalidCredentials
		}
		utils.Log.Error("Password hash comparison failed", zap.String("username", username), zap.Error(err))
		return nil, "", nil, fmt.Errorf("%w: failed to compare password hash", ErrInternalService)
	}

	if user.IsTwoFAEnabled {
		utils.Log.Info("AuthenticateUser: Password valid, 2FA required", zap.String("userID", user.ID))
		return user, "", nil, ErrTwoFARequired
	}

	token, claims, err := utils.GenerateJWTToken(user)
	if err != nil {
		utils.Log.Error("Failed to generate JWT token in service", zap.String("username", user.Username), zap.Error(err))
		return nil, "", nil, fmt.Errorf("%w: failed to generate token", ErrInternalService)
	}

	utils.Log.Info("User authenticated successfully in service", zap.String("username", user.Username), zap.String("role", user.Role))
	return user, token, claims, nil
}

// ##################################################################
// #################### C O D E   F I X   H E R E ###################
// ##################################################################
func (s *userService) LogoutUser(tokenString string) error {
	utils.Log.Info("UserService: Attempting to logout user by blacklisting token.", zap.String("token_prefix", tokenString[:min(len(tokenString), 10)]))

	claims, err := utils.ValidateJWTToken(tokenString)
	if err != nil {
		// لاگ‌گیری و مدیریت خطاهای اعتبارسنجی توکن
		utils.Log.Error("UserService: Failed to parse or validate token for logout", zap.Error(err),
			zap.String("token_prefix", tokenString[:min(len(tokenString), 10)]))
		if errors.Is(err, jwt.ErrTokenExpired) || errors.Is(err, jwt.ErrTokenMalformed) || errors.Is(err, jwt.ErrSignatureInvalid) {
			// اگر توکن از قبل نامعتبر است، خطای خاصی نیاز نیست و می‌توان آن را نادیده گرفت
			return nil
		}
		return fmt.Errorf("%w: token validation failed during logout: %v", ErrInternalService, err)
	}

	// FIX: استخراج شناسه توکن (JTI) از claims
	// این شناسه به عنوان کلید در Redis استفاده خواهد شد
	jti := claims.ID
	if jti == "" {
		utils.Log.Error("UserService: Token does not have a JTI (ID claim). Cannot blacklist.",
			zap.String("username", claims.Username))
		return fmt.Errorf("%w: token is missing JTI claim", ErrInternalService)
	}

	if claims.ExpiresAt == nil {
		utils.Log.Error("UserService: Token has no expiration time (Exp claim) for blacklisting.",
			zap.String("username", claims.Username))
		return fmt.Errorf("%w: token has no expiration time", ErrInternalService)
	}

	expirationTime := claims.ExpiresAt.Time
	ttl := time.Until(expirationTime)

	// اگر توکن از قبل منقضی شده، نیازی به قرار دادن در لیست سیاه نیست
	if ttl < 0 {
		utils.Log.Warn("UserService: Attempt to blacklist an already expired token.",
			zap.String("username", claims.Username), zap.Time("expires_at", expirationTime))
		return nil
	}

	// FIX: ارسال شناسه توکن (jti) به جای کل رشته توکن به Redis
	err = s.tokenRepo.AddTokenToBlacklist(context.Background(), jti, ttl)
	if err != nil {
		utils.Log.Error("UserService: Failed to add token JTI to blacklist", zap.String("jti", jti), zap.String("username", claims.Username), zap.Error(err))
		return fmt.Errorf("%w: failed to blacklist token", ErrInternalService)
	}

	utils.Log.Info("UserService: Token successfully blacklisted by JTI.",
		zap.String("username", claims.Username),
		zap.String("jti", jti), // لاگ کردن JTI برای ردگیری بهتر
		zap.Duration("ttl", ttl))
	return nil
}

// min is a helper function to ensure we don't slice beyond string length
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (s *userService) RequestPasswordReset(email string) (string, error) {
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("RequestPasswordReset: Attempt to reset password for non-existent email", zap.String("email", email))
			return "", ErrUserNotFound
		}
		utils.Log.Error("RequestPasswordReset: Error getting user by email", zap.String("email", email), zap.Error(err))
		return "", fmt.Errorf("%w: error retrieving user by email: %v", ErrInternalService, err)
	}

	if err := s.passwordResetTokenRepo.DeleteTokensByUserID(user.ID); err != nil {
		utils.Log.Error("RequestPasswordReset: Failed to delete existing reset tokens for user", zap.String("userID", user.ID), zap.Error(err))
	}

	resetTokenString, err := utils.GenerateSecureRandomToken(32)
	if err != nil {
		utils.Log.Error("RequestPasswordReset: Failed to generate secure random token", zap.Error(err))
		return "", fmt.Errorf("%w: failed to generate reset token: %v", ErrInternalService, err)
	}

	expiresAt := time.Now().Add(time.Hour * 1) // Token expires in 1 hour

	prToken := &model.PasswordResetToken{
		Token:     resetTokenString,
		UserID:    user.ID,
		Email:     user.Email,
		ExpiresAt: expiresAt,
	}

	if err := s.passwordResetTokenRepo.CreateToken(prToken); err != nil {
		utils.Log.Error("RequestPasswordReset: Failed to create password reset token in DB", zap.String("email", email), zap.Error(err))
		return "", fmt.Errorf("%w: failed to store reset token: %v", ErrInternalService, err)
	}

	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", resetTokenString)
	utils.Log.Info("Password reset requested. Token generated (email sending not implemented).",
		zap.String("email", email),
		zap.String("userID", user.ID),
		zap.String("resetLink_DEV_ONLY", resetLink),
	)

	return resetTokenString, nil
}

func (s *userService) ResetPassword(tokenString string, newPassword string) error {
	if tokenString == "" || newPassword == "" {
		return errors.New("token and new password must be provided")
	}

	prToken, err := s.passwordResetTokenRepo.GetToken(tokenString)
	if err != nil {
		var tokenPrefix string
		if len(tokenString) > 10 {
			tokenPrefix = tokenString[:10]
		} else {
			tokenPrefix = tokenString
		}
		if errors.Is(err, postgresDb.ErrPasswordResetTokenNotFound) || errors.Is(err, postgresDb.ErrPasswordResetTokenExpired) {
			utils.Log.Warn("ResetPassword: Invalid or expired token presented", zap.String("token_prefix", tokenPrefix), zap.Error(err))
			return ErrPasswordResetTokenInvalid
		}
		utils.Log.Error("ResetPassword: Failed to get token from repository", zap.String("token_prefix", tokenPrefix), zap.Error(err))
		return fmt.Errorf("%w: error retrieving reset token: %v", ErrInternalService, err)
	}

	if time.Now().After(prToken.ExpiresAt) {
		utils.Log.Warn("ResetPassword: Attempt to use expired token (checked again in service)", zap.String("token", tokenString))
		_ = s.passwordResetTokenRepo.DeleteToken(tokenString)
		return ErrPasswordResetTokenInvalid
	}

	user, err := s.userRepo.GetUserByID(prToken.UserID)
	if err != nil {
		utils.Log.Error("ResetPassword: Failed to get user by ID associated with token", zap.String("userID", prToken.UserID), zap.Error(err))
		_ = s.passwordResetTokenRepo.DeleteToken(tokenString)
		return fmt.Errorf("%w: error retrieving user for password reset: %v", ErrInternalService, err)
	}

	newHashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		utils.Log.Error("ResetPassword: Failed to hash new password", zap.String("userID", user.ID), zap.Error(err))
		return fmt.Errorf("%w: failed to hash new password: %v", ErrInternalService, err)
	}

	user.PasswordHash = newHashedPassword
	if err := s.userRepo.UpdateUser(user); err != nil {
		utils.Log.Error("ResetPassword: Failed to update user password in repository", zap.String("userID", user.ID), zap.Error(err))
		return fmt.Errorf("%w: failed to update user password: %v", ErrInternalService, err)
	}

	if err := s.passwordResetTokenRepo.DeleteToken(tokenString); err != nil {
		utils.Log.Error("ResetPassword: Failed to delete used reset token. Manual cleanup might be needed.", zap.String("token", tokenString), zap.Error(err))
	}

	utils.Log.Info("Password successfully reset for user", zap.String("userID", user.ID), zap.String("username", user.Username))
	return nil
}

func (s *userService) ChangeUsername(userID string, newUsername string, currentPassword string) error {
	if userID == "" || newUsername == "" || currentPassword == "" {
		return errors.New("userID, newUsername, and currentPassword are required")
	}

	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("ChangeUsername: User not found by ID", zap.String("userID", userID))
			return ErrUserNotFound
		}
		utils.Log.Error("ChangeUsername: Failed to get user by ID", zap.String("userID", userID), zap.Error(err))
		return fmt.Errorf("%w: failed to retrieve user: %v", ErrInternalService, err)
	}

	if err := utils.CheckPasswordHash(currentPassword, user.PasswordHash); err != nil {
		utils.Log.Warn("ChangeUsername: Invalid current password provided", zap.String("userID", userID))
		return ErrInvalidCredentials
	}

	if user.Username == newUsername {
		utils.Log.Info("ChangeUsername: New username is the same as current; no change needed.", zap.String("userID", userID), zap.String("username", newUsername))
		return nil
	}

	existingUserWithNewName, err := s.userRepo.GetUserByUsername(newUsername)
	if err != nil && !errors.Is(err, postgresDb.ErrUserNotFound) {
		utils.Log.Error("ChangeUsername: Failed to check if new username is taken", zap.String("newUsername", newUsername), zap.Error(err))
		return fmt.Errorf("%w: failed to verify new username availability: %v", ErrInternalService, err)
	}
	if existingUserWithNewName != nil && existingUserWithNewName.ID != userID {
		utils.Log.Warn("ChangeUsername: New username is already taken by another user", zap.String("newUsername", newUsername))
		return ErrUsernameTaken
	}

	user.Username = newUsername
	if errUpdate := s.userRepo.UpdateUser(user); errUpdate != nil {
		if errors.Is(errUpdate, postgresDb.ErrDuplicateUser) {
			utils.Log.Warn("ChangeUsername: Username or email taken due to duplicate error from repository on update", zap.String("userID", userID), zap.String("newUsername", newUsername), zap.Error(errUpdate))
			return ErrUsernameTaken
		}
		utils.Log.Error("ChangeUsername: Failed to update username in repository", zap.String("userID", userID), zap.String("newUsername", newUsername), zap.Error(errUpdate))
		return fmt.Errorf("%w: failed to update username: %v", ErrInternalService, errUpdate)
	}

	utils.Log.Info("Username changed successfully", zap.String("userID", userID), zap.String("newUsername", newUsername))
	return nil
}

func (s *userService) ChangePassword(userID string, currentPassword string, newPassword string) error {
	if userID == "" || currentPassword == "" || newPassword == "" {
		return errors.New("userID, currentPassword, and newPassword are required")
	}

	if len(newPassword) < 8 {
		return ErrPasswordPolicyViolation
	}

	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("ChangePassword: User not found by ID", zap.String("userID", userID))
			return ErrUserNotFound
		}
		utils.Log.Error("ChangePassword: Failed to get user by ID", zap.String("userID", userID), zap.Error(err))
		return fmt.Errorf("%w: failed to retrieve user: %v", ErrInternalService, err)
	}

	if err := utils.CheckPasswordHash(currentPassword, user.PasswordHash); err != nil {
		utils.Log.Warn("ChangePassword: Invalid current password provided", zap.String("userID", userID))
		return ErrInvalidCredentials
	}

	if err := utils.CheckPasswordHash(newPassword, user.PasswordHash); err == nil {
		utils.Log.Info("ChangePassword: New password is the same as the old password. No change needed.", zap.String("userID", userID))
		return nil
	}

	newHashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		utils.Log.Error("ChangePassword: Failed to hash new password", zap.String("userID", user.ID), zap.Error(err))
		return fmt.Errorf("%w: failed to hash new password: %v", ErrInternalService, err)
	}

	user.PasswordHash = newHashedPassword
	if err := s.userRepo.UpdateUser(user); err != nil {
		utils.Log.Error("ChangePassword: Failed to update password in repository", zap.String("userID", user.ID), zap.Error(err))
		return fmt.Errorf("%w: failed to update password: %v", ErrInternalService, err)
	}

	utils.Log.Info("Password changed successfully", zap.String("userID", user.ID))
	return nil
}

func (s *userService) GenerateTwoFASetup(userID string) (string, string, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("GenerateTwoFASetup: User not found by ID", zap.String("userID", userID))
			return "", "", ErrUserNotFound
		}
		utils.Log.Error("GenerateTwoFASetup: GetUserByID failed", zap.String("userID", userID), zap.Error(err))
		return "", "", fmt.Errorf("%w: failed to retrieve user for 2FA setup: %v", ErrInternalService, err)
	}

	if user.IsTwoFAEnabled {
		utils.Log.Warn("GenerateTwoFASetup: 2FA already enabled for user", zap.String("userID", userID))
		return "", "", ErrTwoFAAlreadyEnabled
	}

	encryptionKey := utils.GetEncryptionKey()
	if len(encryptionKey) == 0 {
		utils.Log.Error("GenerateTwoFASetup: Encryption key not configured or is empty. This is a critical security risk and operational failure.")
		return "", "", fmt.Errorf("%w: encryption key not configured", ErrInternalService)
	}
	utils.Log.Debug("GenerateTwoFASetup: Retrieved encryption key", zap.String("userID", userID), zap.Int("key_length", len(encryptionKey)))

	accountName := user.Email
	if accountName == "" {
		accountName = user.Username
	}
	if accountName == "" {
		return "", "", errors.New("user has no email or username to generate 2FA key")
	}

	rawSecret, err := utils.GenerateTOTPSecret(accountName)
	if err != nil {
		utils.Log.Error("GenerateTwoFASetup: utils.GenerateTOTPSecret failed", zap.String("userID", userID), zap.String("accountName", accountName), zap.Error(err))
		return "", "", ErrTwoFASecretGeneration
	}
	utils.Log.Debug("GenerateTwoFASetup: Generated raw TOTP secret", zap.String("userID", userID), zap.String("rawSecretPrefix", rawSecret[:min(len(rawSecret), 5)]))

	encryptedSecret, err := utils.Encrypt(rawSecret, encryptionKey)
	if err != nil {
		utils.Log.Error("GenerateTwoFASetup: utils.Encrypt failed for TOTP secret", zap.String("userID", userID), zap.Error(err))
		return "", "", fmt.Errorf("%w: failed to encrypt 2FA secret: %v", ErrInternalService, err)
	}

	hashedSecretForLog, _ := utils.HashRecoveryCode(encryptedSecret)
	utils.Log.Debug("GenerateTwoFASetup: Encrypted TOTP secret", zap.String("userID", userID), zap.String("encryptedSecretHashForLog", hashedSecretForLog))

	user.TwoFASecret = encryptedSecret

	newTwoFASecretHashForLog, _ := utils.HashRecoveryCode(user.TwoFASecret)
	utils.Log.Debug("GenerateTwoFASetup: Attempting to update user with new TwoFASecret",
		zap.String("userID", user.ID),
		zap.String("username", user.Username),
		zap.String("newTwoFASecretHashForLog", newTwoFASecretHashForLog))

	if errUpdate := s.userRepo.UpdateUser(user); errUpdate != nil {
		attemptedTwoFASecretHashForLog, _ := utils.HashRecoveryCode(user.TwoFASecret)
		utils.Log.Error("GenerateTwoFASetup: Failed to save TwoFASecret to user via userRepo.UpdateUser",
			zap.String("userID", userID),
			zap.String("username", user.Username),
			zap.String("attemptedTwoFASecretHashForLog", attemptedTwoFASecretHashForLog),
			zap.Error(errUpdate))
		return "", "", fmt.Errorf("%w: failed to save 2FA secret to user profile: %v", ErrInternalService, errUpdate)
	}
	utils.Log.Info("GenerateTwoFASetup: Successfully updated user with TwoFASecret (still disabled)", zap.String("userID", user.ID))

	qrCodeURL := utils.GenerateTOTPQRCodeURL("ProfileGoldApp", accountName, rawSecret)

	return rawSecret, qrCodeURL, nil
}

func (s *userService) VerifyAndEnableTwoFA(userID string, totpCode string) ([]string, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("VerifyAndEnableTwoFA: User not found by ID", zap.String("userID", userID))
			return nil, ErrUserNotFound
		}
		utils.Log.Error("VerifyAndEnableTwoFA: GetUserByID failed", zap.String("userID", userID), zap.Error(err))
		return nil, fmt.Errorf("%w: failed to retrieve user for 2FA enable: %v", ErrInternalService, err)
	}

	if user.IsTwoFAEnabled {
		utils.Log.Warn("VerifyAndEnableTwoFA: 2FA already enabled for user", zap.String("userID", userID))
		return nil, ErrTwoFAAlreadyEnabled
	}
	if user.TwoFASecret == "" {
		utils.Log.Warn("VerifyAndEnableTwoFA: 2FA secret not found for user", zap.String("userID", userID))
		return nil, errors.New("2FA secret not generated or found for user; please start setup again")
	}

	encryptionKey := utils.GetEncryptionKey()
	decryptedSecret, err := utils.Decrypt(user.TwoFASecret, encryptionKey)
	if err != nil {
		utils.Log.Error("VerifyAndEnableTwoFA: Failed to decrypt 2FA secret", zap.String("userID", userID), zap.Error(err))
		return nil, fmt.Errorf("%w: could not decrypt 2FA secret for verification", ErrInternalService)
	}

	validTOTP, errValidate := utils.ValidateTOTP(decryptedSecret, totpCode)
	if errValidate != nil {
		utils.Log.Warn("VerifyAndEnableTwoFA: TOTP validation failed (app logic error)", zap.String("userID", userID), zap.Error(errValidate))
		return nil, ErrTwoFAInvalidCode
	}
	if !validTOTP {
		utils.Log.Warn("VerifyAndEnableTwoFA: Invalid TOTP code provided by user", zap.String("userID", userID))
		return nil, ErrTwoFAInvalidCode
	}

	plainRecoveryCodes, err := utils.GenerateRecoveryCodes(10, 12)
	if err != nil {
		utils.Log.Error("VerifyAndEnableTwoFA: Failed to generate recovery codes", zap.String("userID", userID), zap.Error(err))
		return nil, fmt.Errorf("%w: failed to generate recovery codes: %v", ErrInternalService, err)
	}

	hashedRecoveryCodes := make([]string, len(plainRecoveryCodes))
	for i, code := range plainRecoveryCodes {
		hashedCode, errHash := utils.HashRecoveryCode(code)
		if errHash != nil {
			utils.Log.Error("VerifyAndEnableTwoFA: Failed to hash a recovery code", zap.String("userID", userID), zap.Error(errHash))
			return nil, fmt.Errorf("%w: failed to hash recovery code: %v", ErrInternalService, errHash)
		}
		hashedRecoveryCodes[i] = hashedCode
	}

	codesJSON, err := json.Marshal(hashedRecoveryCodes)
	if err != nil {
		utils.Log.Error("VerifyAndEnableTwoFA: Failed to marshal recovery codes", zap.String("userID", userID), zap.Error(err))
		return nil, ErrInternalService
	}

	user.IsTwoFAEnabled = true
	user.TwoFARecoveryCodes = string(codesJSON)

	if err := s.userRepo.UpdateUser(user); err != nil {
		utils.Log.Error("VerifyAndEnableTwoFA: Failed to update user to enable 2FA", zap.String("userID", userID), zap.Error(err))
		return nil, ErrTwoFAEnableFailed
	}

	utils.Log.Info("2FA enabled successfully for user", zap.String("userID", user.ID))
	return plainRecoveryCodes, nil
}

func (s *userService) DisableTwoFA(userID string, currentPassword string) error {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("DisableTwoFA: User not found by ID", zap.String("userID", userID))
			return ErrUserNotFound
		}
		utils.Log.Error("DisableTwoFA: GetUserByID failed", zap.String("userID", userID), zap.Error(err))
		return fmt.Errorf("%w: failed to retrieve user for 2FA disable: %v", ErrInternalService, err)
	}

	if !user.IsTwoFAEnabled {
		utils.Log.Warn("DisableTwoFA: 2FA not enabled for user", zap.String("userID", userID))
		return ErrTwoFANotEnabled
	}

	if err := utils.CheckPasswordHash(currentPassword, user.PasswordHash); err != nil {
		utils.Log.Warn("DisableTwoFA: Invalid current password", zap.String("userID", userID))
		return ErrInvalidCredentials
	}

	user.IsTwoFAEnabled = false
	user.TwoFASecret = ""
	user.TwoFARecoveryCodes = ""
	if err := s.userRepo.UpdateUser(user); err != nil {
		utils.Log.Error("DisableTwoFA: Failed to update user to disable 2FA", zap.String("userID", userID), zap.Error(err))
		return ErrTwoFADisableFailed
	}
	utils.Log.Info("2FA disabled successfully for user", zap.String("userID", user.ID))
	return nil
}

func (s *userService) VerifyTOTP(userID string, totpCode string) (bool, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("VerifyTOTP: User not found by ID", zap.String("userID", userID))
			return false, ErrUserNotFound
		}
		utils.Log.Error("VerifyTOTP: GetUserByID failed", zap.String("userID", userID), zap.Error(err))
		return false, fmt.Errorf("%w: failed to retrieve user for TOTP verification: %v", ErrInternalService, err)
	}

	if !user.IsTwoFAEnabled || user.TwoFASecret == "" {
		utils.Log.Warn("VerifyTOTP: Attempted to verify TOTP for user without 2FA enabled/configured", zap.String("userID", userID))
		return false, ErrTwoFANotEnabled
	}

	encryptionKey := utils.GetEncryptionKey()
	decryptedSecret, err := utils.Decrypt(user.TwoFASecret, encryptionKey)
	if err != nil {
		utils.Log.Error("VerifyTOTP: Failed to decrypt 2FA secret during login", zap.String("userID", userID), zap.Error(err))
		return false, fmt.Errorf("%w: could not decrypt 2FA secret for login TOTP check", ErrInternalService)
	}

	isValid, errValidate := utils.ValidateTOTP(decryptedSecret, totpCode)
	if errValidate != nil {
		utils.Log.Warn("VerifyTOTP: TOTP validation failed (app logic error)", zap.String("userID", userID), zap.Error(errValidate))
		return false, ErrTwoFAInvalidCode
	}
	if !isValid {
		utils.Log.Warn("VerifyTOTP: Invalid TOTP code provided by user during login", zap.String("userID", userID))
	}
	return isValid, nil
}

func (s *userService) GetUserByIDForTokenGeneration(userID string) (*model.User, error) {
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, postgresDb.ErrUserNotFound) {
			utils.Log.Warn("GetUserByIDForTokenGeneration: User not found", zap.String("userID", userID))
			return nil, ErrUserNotFound
		}
		utils.Log.Error("GetUserByIDForTokenGeneration: Error retrieving user", zap.String("userID", userID), zap.Error(err))
		return nil, fmt.Errorf("%w: failed to get user by ID: %v", ErrInternalService, err)
	}
	return user, nil
}