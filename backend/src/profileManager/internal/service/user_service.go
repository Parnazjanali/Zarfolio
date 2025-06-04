package service

import (
	"errors"
	"fmt"
	"profile-gold/internal/model"
	"profile-gold/internal/repository/db/postgresDb" // Corrected import path
	redisdb "profile-gold/internal/repository/db/redisDb"
	"profile-gold/internal/utils"
	"strings" // Added import for strings package
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("user with this username or email already exists")
	ErrInternalService    = errors.New("internal service error")
	ErrPasswordResetTokenInvalid = errors.New("password reset token is invalid or expired")
)

type UserService interface {
	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(username, password string) (*model.User, string, *utils.CustomClaims, error)
	LogoutUser(tokenString string) error
	RequestPasswordReset(email string) (string, error) // Returns token string for now
	ResetPassword(tokenString string, newPassword string) error
}

type userService struct {
	userRepo              postgresDb.UserRepository
	tokenRepo             redisdb.TokenRepository
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
		userRepo:              r,
		tokenRepo:             t,
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
	// Ensure it's specifically ErrUserNotFound from the correct package (postgresDb.ErrUserNotFound)
	// We need to import postgresDb or use a more generic error check if GetUserByEmail can return other ErrUserNotFound types
	// For now, assuming GetUserByEmail from postgresUserRepository returns postgresDb.ErrUserNotFound
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
		// Check if the error from CreateUser is because the user already exists (e.g. due to a race condition or other constraint)
		// This specific check might be redundant if GetUserByUsername/Email are reliable and cover all cases.
		// However, some DB drivers might return a generic duplicate error rather than a specific one that can be easily mapped to ErrUserAlreadyExists.
		// For now, we rely on the GORM's ErrDuplicatedKey being handled in the repo layer if possible,
		// or a more generic error here. The primary checks are above.
		if strings.Contains(strings.ToLower(err.Error()), "duplicate key") || strings.Contains(strings.ToLower(err.Error()), "unique constraint") {
			utils.Log.Warn("CreateUser returned a duplicate error, implies race condition or unhandled constraint", zap.Error(err))
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

	token, claims, err := utils.GenerateJWTToken(user)
	if err != nil {
		utils.Log.Error("Failed to generate JWT token in service", zap.String("username", user.Username), zap.Error(err))
		return nil, "", nil, fmt.Errorf("%w: failed to generate token", ErrInternalService)
	}

	utils.Log.Info("User authenticated successfully in service", zap.String("username", user.Username), zap.String("role", user.Role))
	return user, token, claims, nil
}

func (s *userService) LogoutUser(tokenString string) error {
	utils.Log.Info("UserService: Attempting to logout user by blacklisting token.", zap.String("token_prefix", tokenString[:min(len(tokenString), 10)]))

	claims, err := utils.ValidateJWTToken(tokenString)

	if err != nil {
		utils.Log.Error("UserService: Failed to parse or validate token for logout", zap.Error(err),
			zap.String("token_prefix", tokenString[:min(len(tokenString), 10)]))
		if errors.Is(err, jwt.ErrTokenExpired) || errors.Is(err, jwt.ErrTokenMalformed) || errors.Is(err, jwt.ErrSignatureInvalid) {
			return ErrInvalidCredentials
		}
		return fmt.Errorf("%w: token validation failed during logout: %v", ErrInternalService, err)
	}

	if claims.ExpiresAt == nil {
		utils.Log.Error("UserService: Token has no expiration time (Exp claim) for blacklisting.",
			zap.String("username", claims.Username))
		return fmt.Errorf("%w: token has no expiration time", ErrInternalService)
	}

	expirationTime := claims.ExpiresAt.Time

	ttl := time.Until(expirationTime)
	if ttl < 0 {
		utils.Log.Warn("UserService: Attempt to blacklist an already expired token.",
			zap.String("username", claims.Username), zap.Time("expires_at", expirationTime))
		return nil
	}
	err = s.tokenRepo.AddTokenToBlacklist(tokenString, ttl)
	if err != nil {
		utils.Log.Error("UserService: Failed to add token to blacklist", zap.String("username", claims.Username), zap.Error(err))
		return fmt.Errorf("%w: failed to blacklist token", ErrInternalService)
	}

	utils.Log.Info("UserService: Token successfully blacklisted.",
		zap.String("username", claims.Username),
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
			// To prevent email enumeration, we can return a generic success message here.
			// However, for now, let's log it and return UserNotFound for easier debugging during development.
			// In production, consider always returning nil error here.
			utils.Log.Warn("RequestPasswordReset: Attempt to reset password for non-existent email", zap.String("email", email))
			return "", ErrUserNotFound // Or nil, depending on security policy for email enumeration
		}
		utils.Log.Error("RequestPasswordReset: Error getting user by email", zap.String("email", email), zap.Error(err))
		return "", fmt.Errorf("%w: error retrieving user by email: %v", ErrInternalService, err)
	}

	// Invalidate any existing tokens for this user to prevent multiple active reset links
	if err := s.passwordResetTokenRepo.DeleteTokensByUserID(user.ID); err != nil {
		utils.Log.Error("RequestPasswordReset: Failed to delete existing reset tokens for user", zap.String("userID", user.ID), zap.Error(err))
		// Continue, as this is not critical enough to stop the password reset flow
	}

	resetTokenString, err := utils.GenerateSecureRandomToken(32) // Assuming a utility function to generate a crypto-secure token
	if err != nil {
		utils.Log.Error("RequestPasswordReset: Failed to generate secure random token", zap.Error(err))
		return "", fmt.Errorf("%w: failed to generate reset token: %v", ErrInternalService, err)
	}

	expiresAt := time.Now().Add(time.Hour * 1) // Token expires in 1 hour

	prToken := &model.PasswordResetToken{
		// ID will be generated by DB if using uuid_generate_v4()
		Token:     resetTokenString,
		UserID:    user.ID,
		Email:     user.Email, // Use the email from the found user object
		ExpiresAt: expiresAt,
	}

	if err := s.passwordResetTokenRepo.CreateToken(prToken); err != nil {
		utils.Log.Error("RequestPasswordReset: Failed to create password reset token in DB", zap.String("email", email), zap.Error(err))
		return "", fmt.Errorf("%w: failed to store reset token: %v", ErrInternalService, err)
	}

	// TODO: Implement actual email sending here.
	// For now, log the token and the reset link.
	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", resetTokenString) // Example frontend URL
	utils.Log.Info("Password reset requested. Token generated (email sending not implemented).",
		zap.String("email", email),
		zap.String("userID", user.ID),
		// zap.String("resetToken", resetTokenString), // Avoid logging sensitive token in production if possible
		zap.String("resetLink_DEV_ONLY", resetLink),
	)

	return resetTokenString, nil // Return token for now (e.g. for testing/dev)
}

func (s *userService) ResetPassword(tokenString string, newPassword string) error {
	if tokenString == "" || newPassword == "" {
		return errors.New("token and new password must be provided")
	}

	prToken, err := s.passwordResetTokenRepo.GetToken(tokenString)
	if err != nil {
		// Use a safe prefix for logging, ensuring not to panic if tokenString is too short (though it shouldn't be)
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

	// GetToken already checks for expiry, but double check here just in case of race or different repo impl.
	if time.Now().After(prToken.ExpiresAt) {
		utils.Log.Warn("ResetPassword: Attempt to use expired token (checked again in service)", zap.String("token", tokenString))
		// Ensure token is deleted if it was somehow retrieved despite being expired by repo
		_ = s.passwordResetTokenRepo.DeleteToken(tokenString)
		return ErrPasswordResetTokenInvalid
	}

	user, err := s.userRepo.GetUserByID(prToken.UserID) // Need GetUserByID in UserRepository
	if err != nil {
		utils.Log.Error("ResetPassword: Failed to get user by ID associated with token", zap.String("userID", prToken.UserID), zap.Error(err))
		// Even if user not found, try to delete token to prevent reuse if user is later created with same ID (unlikely)
		_ = s.passwordResetTokenRepo.DeleteToken(tokenString)
		return fmt.Errorf("%w: error retrieving user for password reset: %v", ErrInternalService, err)
	}

	newHashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		utils.Log.Error("ResetPassword: Failed to hash new password", zap.String("userID", user.ID), zap.Error(err))
		return fmt.Errorf("%w: failed to hash new password: %v", ErrInternalService, err)
	}

	user.PasswordHash = newHashedPassword
	if err := s.userRepo.UpdateUser(user); err != nil { // Need UpdateUser in UserRepository
		utils.Log.Error("ResetPassword: Failed to update user password in repository", zap.String("userID", user.ID), zap.Error(err))
		return fmt.Errorf("%w: failed to update user password: %v", ErrInternalService, err)
	}

	// Password updated successfully, now delete the reset token
	if err := s.passwordResetTokenRepo.DeleteToken(tokenString); err != nil {
		// Log this error but don't fail the whole operation as password was reset
		utils.Log.Error("ResetPassword: Failed to delete used reset token. Manual cleanup might be needed.", zap.String("token", tokenString), zap.Error(err))
	}

	utils.Log.Info("Password successfully reset for user", zap.String("userID", user.ID), zap.String("username", user.Username))
	return nil
}
