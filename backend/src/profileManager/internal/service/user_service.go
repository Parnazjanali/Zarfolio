package service

import (
	"errors"
	"fmt"
	"time"

	"profile-gold/internal/model"
	"profile-gold/internal/repository/db/postgresDb"
	redisdb "profile-gold/internal/repository/db/redisDb"
	"profile-gold/internal/utils"

	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("user with this username or email already exists")
	ErrInternalService    = errors.New("internal service error")
)

type UserService interface {
	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(username, password string) (*model.User, string, *utils.CustomClaims, error)
	LogoutUser(tokenString string) error
}

type userService struct {
	userRepo  postgresDb.UserRepository
	tokenRepo redisdb.TokenRepository
}

func NewUserService(r postgresDb.UserRepository, t redisdb.TokenRepository) UserService {
	if r == nil {
		utils.Log.Fatal("UserRepository cannot be nil for UserService.")
	}
	if t == nil {
		utils.Log.Fatal("TokenRepository cannot be nil for UserService.")
	}
	utils.Log.Info("UserService initialized successfully with UserRepo and tokenRepo.")
	return &userService{userRepo: r, tokenRepo: t}
}

func (s *userService) RegisterUser(req model.RegisterRequest) error {

	_, err := s.userRepo.GetUserByUsername(req.Username)
	if err == nil {
		return ErrUserAlreadyExists
	}
	if !errors.Is(err, postgresDb.ErrUserNotFound) {
		return fmt.Errorf("%w: failed to check existing user during registration", ErrInternalService)
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
		if errors.Is(err, fmt.Errorf("user with username '%s' already exists", newUser.Username)) {
			return ErrUserAlreadyExists
		}
		return fmt.Errorf("%w: failed to create user", ErrInternalService)
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
