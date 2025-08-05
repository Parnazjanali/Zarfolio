package auth

import (
	"errors"
	"fmt"
	"profile-gold/internal/model"
	"profile-gold/internal/repository/db/postgresDb"
	redisdb "profile-gold/internal/repository/db/redisDb"
	service "profile-gold/internal/service/common"
	"profile-gold/internal/utils"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)
<<<<<<< HEAD
=======

>>>>>>> parnaz-changes
type AuthService interface {
	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(username, password string) (*model.User, string, *model.CustomClaims, error)
	LogoutUser(tokenString string) error
	RequestPasswordReset(email string) error
	ResetPassword(token, newPassword string) error
	VerifyTwoFA(username, code string) (model.User, model.CustomClaims, error)
}
<<<<<<< HEAD

type UserService struct {
	userRepo  postgresDb.UserRepository
	tokenRepo redisdb.TokenRepository
	jwtValidator utils.JWTValidator
=======
type EmailService interface {
	SendPasswordResetEmail(toEmail, resetToken string) error
}

type UserService struct {
	userRepo     postgresDb.UserRepository
	tokenRepo    redisdb.TokenRepository
	jwtValidator utils.JWTValidator
	emailService EmailService
>>>>>>> parnaz-changes
}

func NewAuthService(r postgresDb.UserRepository, t redisdb.TokenRepository, j utils.JWTValidator) AuthService {
	if r == nil {
		utils.Log.Fatal("UserRepository cannot be nil for UserService.")
	}
	if t == nil {
		utils.Log.Fatal("TokenRepository cannot be nil for UserService.")
	}
	if j == nil {
		utils.Log.Fatal("JWTValidator cannot be nil for UserService.")
	}
	utils.Log.Info("UserService initialized successfully with UserRepo and tokenRepo.")
	return &UserService{userRepo: r, tokenRepo: t, jwtValidator: j}
}

func (s *UserService) RegisterUser(req model.RegisterRequest) error {

	_, err := s.userRepo.GetUserByUsername(req.Username)
	if err == nil {
		return service.ErrUserAlreadyExists
	}
	if !errors.Is(err, service.ErrUserNotFound) {
		return fmt.Errorf("%w: failed to check existing user during registration", service.ErrInternalService)
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.Log.Error("Failed to hash password for registration", zap.String("username", req.Username), zap.Error(err))
		return fmt.Errorf("%w: failed to hash password", service.ErrInternalService)
	}

	newUser := &model.User{
		Username:     req.Username,
		PasswordHash: hashedPassword,
		Email:        req.Email,
	}

	err = s.userRepo.CreateUser(newUser)
	if err != nil {
		utils.Log.Error("Failed to create user in repository", zap.String("username", newUser.Username), zap.Error(err))
		if errors.Is(err, fmt.Errorf("user with username '%s' already exists", newUser.Username)) {
			return service.ErrUserAlreadyExists
		}
		return fmt.Errorf("%w: failed to create user", service.ErrInternalService)
	}

	utils.Log.Info("User registered successfully in service", zap.String("username", newUser.Username))
	return nil
}

func (s *UserService) AuthenticateUser(username, password string) (*model.User, string, *model.CustomClaims, error) {
	user, err := s.userRepo.GetUserByUsername(username)

	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.Log.Warn("UserService: Authentication failed - User not found in repo", zap.String("username", username))
			return nil, "", nil, service.ErrInvalidCredentials
		}

		utils.Log.Error("UserService: Failed to get user by username from repo (DB error)", zap.String("username", username), zap.Error(err))
		return nil, "", nil, fmt.Errorf("%w: failed to retrieve user from repository", service.ErrInternalService)
	}

	if user == nil {
		utils.Log.Fatal("UserService: GetUserByUsername returned a nil user object without an error. This is an unexpected state from the repository.", zap.String("username", username))
		return nil, "", nil, fmt.Errorf("%w: unexpected nil user object from repository", service.ErrInternalService)
	}

	err = utils.CheckPasswordHash(password, user.PasswordHash)
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, "", nil, service.ErrInvalidCredentials
		}
		utils.Log.Error("Password hash comparison failed", zap.String("username", username), zap.Error(err))
		return nil, "", nil, fmt.Errorf("%w: failed to compare password hash", service.ErrInternalService)
	}

	token, claims, err := utils.GenerateJWTToken(user)
	if err != nil {
		utils.Log.Error("Failed to generate JWT token in service", zap.String("username", user.Username), zap.Error(err))
		return nil, "", nil, fmt.Errorf("%w: failed to generate token", service.ErrInternalService)
	}

	utils.Log.Info("User authenticated successfully in service", zap.String("username", user.Username), zap.String("role", string(user.Roles)))
	return user, token, claims, nil
}

func (s *UserService) LogoutUser(tokenString string) error {
	utils.Log.Info("UserService: Attempting to logout user by blacklisting token.", zap.String("token_prefix", tokenString[:min(len(tokenString), 10)]))

<<<<<<< HEAD
    claims, err := s.jwtValidator.ValidateToken(tokenString) 
=======
	claims, err := s.jwtValidator.ValidateToken(tokenString)
>>>>>>> parnaz-changes

	if err != nil {
		utils.Log.Error("UserService: Failed to parse or validate token for logout", zap.Error(err),
			zap.String("token_prefix", tokenString[:min(len(tokenString), 10)]))
		if errors.Is(err, jwt.ErrTokenExpired) || errors.Is(err, jwt.ErrTokenMalformed) || errors.Is(err, jwt.ErrSignatureInvalid) {
			return service.ErrInvalidCredentials
		}
		return fmt.Errorf("%w: token validation failed during logout: %v", service.ErrInternalService, err)
	}

	if claims.ExpiresAt == nil {
		utils.Log.Error("UserService: Token has no expiration time (Exp claim) for blacklisting.",
			zap.String("username", claims.Username))
		return fmt.Errorf("%w: token has no expiration time", service.ErrInternalService)
	}

	expirationTime := claims.ExpiresAt.Time

	ttl := time.Until(expirationTime)
	if ttl < 0 {
		utils.Log.Warn("UserService: Attempt to blacklist an already expired token.",
			zap.String("username", claims.Username), zap.Time("expires_at", expirationTime))
		return nil
	}
<<<<<<< HEAD
=======
	utils.Log.Info("UserService: Calculated TTL for token",
		zap.String("username", claims.Username),
		zap.Duration("ttl", ttl),
		zap.Time("expires_at", expirationTime))
>>>>>>> parnaz-changes
	err = s.tokenRepo.AddTokenToBlacklist(tokenString, ttl)
	if err != nil {
		utils.Log.Error("UserService: Failed to add token to blacklist", zap.String("username", claims.Username), zap.Error(err))
		return fmt.Errorf("%w: failed to blacklist token", service.ErrInternalService)
	}

	utils.Log.Info("UserService: Token successfully blacklisted.",
		zap.String("username", claims.Username),
		zap.Duration("ttl", ttl))
	return nil
}

<<<<<<< HEAD
func (s *UserService) RequestPasswordReset(username string) error {
	utils.Log.Info("RequestPasswordReset called", zap.String("username", username))
	// TODO: Implement password reset logic here.
	return errors.New("RequestPasswordReset not implemented")
}

=======
>>>>>>> parnaz-changes
func (s *UserService) ResetPassword(token, newPassword string) error {
	utils.Log.Info("ResetPassword called", zap.String("token_prefix", token[:min(len(token), 10)]))
	// TODO: Implement reset password logic here.
	return errors.New("ResetPassword not implemented")
}

<<<<<<< HEAD
=======
// RequestPasswordReset implements the AuthService interface.
func (s *UserService) RequestPasswordReset(email string) error {
	utils.Log.Info("RequestPasswordReset called", zap.String("email", email))
	// TODO: Implement password reset request logic here.
	return errors.New("RequestPasswordReset not implemented")
}

>>>>>>> parnaz-changes
func (s *UserService) VerifyTwoFA(username, code string) (model.User, model.CustomClaims, error) {
	utils.Log.Info("VerifyTwoFA called", zap.String("username", username))
	// TODO: Implement 2FA verification logic here.
	return model.User{}, model.CustomClaims{}, errors.New("VerifyTwoFA not implemented")
}
