package user

import (
	"errors"
	"fmt"
	"profile-gold/internal/api/authz"
	"profile-gold/internal/model"
	"profile-gold/internal/repository/db/postgresDb"
	"profile-gold/internal/utils"

	"go.uber.org/zap"
)

type UserService interface {
	GetUsers() ([]*model.User, error)
	GetUserByID(userID string) (*model.User, error)
	CreateUser(req model.UserCreateRequest) (*model.User, error)
	UpdateUser(userID string, req model.UserUpdateRequest) (*model.User, error)
	DeleteUser(userID string) error
	HandleUpdateUserRoles(userID string, newRoles []string) error
}

type userService struct {
	userRepo          postgresDb.UserRepository
	permissionService authz.PermissionService
}

func NewUserService(userRepo postgresDb.UserRepository, permService authz.PermissionService) (UserService, error) { 
	if userRepo == nil {
		utils.Log.Error("UserRepository cannot be nil for UserService.")
		return nil, fmt.Errorf("UserRepository cannot be nil for UserService.") 
	}
	if permService == nil {
		utils.Log.Error("PermissionService cannot be nil for UserService.")
		return nil, fmt.Errorf("PermissionService cannot be nil for UserService.") 
	}
	utils.Log.Info("UserService initialized successfully.")
	return &userService{
		userRepo:          userRepo,
		permissionService: permService,
	}, nil
}

func (s *userService) GetUsers() ([]*model.User, error) {
	users, err := s.userRepo.GetAllUsers()
	if err != nil {
		return nil, fmt.Errorf("failed to get all users: %w", err)
	}
	utils.Log.Info("Successfully fetched all users.")
	return users, nil
}

func (s *userService) GetUserByID(userID string) (*model.User, error) {

	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by ID %s: %w", userID, err)
	}
	if user == nil {
		return nil, fmt.Errorf("user with ID %s not found", userID)
	}
	utils.Log.Info("Successfully fetched user by ID: %s", zap.String("userID", userID))
	return user, nil
}

func (s *userService) CreateUser(req model.UserCreateRequest) (*model.User, error) {

	if req.Username == "" || req.Password == "" || req.Email == "" {
		return nil, fmt.Errorf("username, password, and email are required")
	}

	existingUser, err := s.userRepo.GetUserByUsername(req.Username)
	if err != nil && !errors.Is(err, errors.New("user not found")) { // اگر خطا، خطای "کاربر یافت نشد" نباشد
		return nil, fmt.Errorf("failed to check username availability: %w", err)
	}
	if existingUser != nil {
		return nil, fmt.Errorf("username %s already exists", req.Username)
	}

	hashedPassword, err := utils.HashPassword(req.Password) // فرض کنید utils.HashPassword وجود دارد
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	newUser := &model.User{
		ID:           utils.GenerateUUID(), // فرض کنید utils.GenerateUUID وجود دارد
		Username:     req.Username,
		PasswordHash: hashedPassword,
		Email:        req.Email,
	}

	err = s.userRepo.CreateUser(newUser)
	if err != nil {
		return nil, fmt.Errorf("failed to create user in repository: %w", err)
	}
	utils.Log.Info("User %s created successfully.", zap.String("useername", newUser.Username))
	return newUser, nil
}

func (s *userService) UpdateUser(userID string, req model.UserUpdateRequest) (*model.User, error) {

	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user for update: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user with ID %s not found", userID)
	}

	if req.Username != "" && req.Username != user.Username {
		existingUser, err := s.userRepo.GetUserByUsername(req.Username)
		if err != nil && !errors.Is(err, errors.New("user not found")) {
			return nil, fmt.Errorf("failed to check new username availability: %w", err)
		}
		if existingUser != nil {
			return nil, fmt.Errorf("username %s already taken", req.Username)
		}
		user.Username = req.Username
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.NewPassword != "" {
		hashedPassword, err := utils.HashPassword(req.NewPassword)
		if err != nil {
			return nil, fmt.Errorf("failed to hash new password: %w", err)
		}
		user.PasswordHash = hashedPassword
	}

	err = s.userRepo.UpdateUser(user)
	if err != nil {
		return nil, fmt.Errorf("failed to update user in repository: %w", err)
	}
	utils.Log.Info("User with ID %s updated successfully.", zap.String("userID", userID))
	return user, nil
}

func (s *userService) DeleteUser(userID string) error {

	err := s.userRepo.DeleteUser(userID)
	if err != nil {
		return fmt.Errorf("failed to delete user %s: %w", userID, err)
	}
	utils.Log.Info("User with ID %s deleted successfully.", zap.String("userID", userID))
	return nil
}

func (s *userService) HandleUpdateUserRoles(userID string, newRoles []string) error {
	
	user, err := s.userRepo.GetUserByID(userID)
	if err != nil {
		return fmt.Errorf("failed to get user for role update: %w", err)
	}
	if user == nil {
		return fmt.Errorf("user with ID %s not found", userID)
	}

	 for _, role := range newRoles {
        if !s.permissionService.IsValidRole(role) { 
            return fmt.Errorf("invalid role provided: %s", role)
        }
    }

    utils.Log.Info("Roles updated successfully for user ID.", zap.String("userID", userID), zap.Strings("newRoles", newRoles)) // 👈 تصحیح لاگ
    return nil

}
