package postgresDb

import (
	"errors"
	"fmt"
	"profile-gold/internal/model"
	service "profile-gold/internal/service/common"
	"profile-gold/internal/utils"
	"sync"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type UserRepository interface {
	GetAllUsers () ([]*model.User, error) 
	CreateUser(user *model.User) error
	GetUserByUsername(username string) (*model.User, error)
	GetUserByID(id string) (*model.User, error) 
	UpdateUser(user *model.User) error
	DeleteUser(id string) error
	UploadProfilePicture(userID string, pictureData []byte) error
	SetUser2FASecret(userID, secret string) error
	GetUser2FASecret(userID string) (string, error)
SetUser2FAStatus(userID string, enabled bool) error
	RemoveUser2FASecret(userID string) error
	 GetUserByEmail(email string) (*model.User, error)
}

type inMemoryUserRepository struct {
	users map[string]*model.User 
	mu    sync.RWMutex          
}

func NewInMemoryUserRepository() UserRepository {
	utils.Log.Warn("Using IN-MEMORY UserRepository. NOT FOR PRODUCTION USE.")
	return &inMemoryUserRepository{
		users: make(map[string]*model.User),
	}
}

// GetUserByEmail returns a user by email from the in-memory repository.
func (r *inMemoryUserRepository) GetUserByEmail(email string) (*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, user := range r.users {
		if user.Email == email {
			utils.Log.Info("User found in in-memory repo by email", zap.String("email", user.Email))
			return user, nil
		}
	}
	return nil, service.ErrUserNotFound
}

// GetAllUsers returns a slice of all users in the in-memory repository.
func (r *inMemoryUserRepository) GetAllUsers() ([]*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	users := make([]*model.User, 0, len(r.users))
	for _, user := range r.users {
		users = append(users, user)
	}
	return users, nil
}

func (r *inMemoryUserRepository) CreateUser(user *model.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.users[user.Username]; exists {
		return fmt.Errorf("user with username '%s' already exists", user.Username)
	}
	if user.ID == "" { 
		user.ID = fmt.Sprintf("in-mem-user-%d", len(r.users)+1)
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	r.users[user.Username] = user
	utils.Log.Info("User created in in-memory repo", zap.String("username", user.Username), zap.String("id", user.ID))
	return nil
}

func (r *inMemoryUserRepository) UpdateUser(user *model.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	existingUser, exists := r.users[user.Username]
	if !exists {
		return service.ErrUserNotFound
	}
	user.CreatedAt = existingUser.CreatedAt 
	user.UpdatedAt = time.Now()
	r.users[user.Username] = user
	utils.Log.Info("User updated in in-memory repo", zap.String("username", user.Username), zap.String("id", user.ID))
	return nil
}

func (r *inMemoryUserRepository) GetUserByUsername(username string) (*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, ok := r.users[username]
	if !ok {
		return nil, service.ErrUserNotFound
	}
	utils.Log.Info("User found in in-memory repo", zap.String("username", user.Username))
	return user, nil
}

func (r *inMemoryUserRepository) GetUserByID(id string) (*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, user := range r.users {
		if user.ID == id {
			utils.Log.Info("User found in in-memory repo by ID", zap.String("id", user.ID))
			return user, nil
		}
	}
	return nil, service.ErrUserNotFound
}

func (r *inMemoryUserRepository) DeleteUser(id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for username, user := range r.users {
		if user.ID == id {
			delete(r.users, username)
			utils.Log.Info("User deleted from in-memory repo", zap.String("id", id))
			return nil
		}
	}
	return service.ErrUserNotFound
}

func (r *inMemoryUserRepository) GetUser2FASecret(userID string) (string, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, user := range r.users {
		if user.ID == userID {
			return user.TwoFASecret, nil
		}
	}
	return "", service.ErrUserNotFound
}

func (r *inMemoryUserRepository) RemoveUser2FASecret(userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, user := range r.users {
		if user.ID == userID {
			user.TwoFASecret = ""
			return nil
		}
	}
	return service.ErrUserNotFound
}

func (r *inMemoryUserRepository) SetUser2FASecret(userID, secret string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, user := range r.users {
		if user.ID == userID {
			user.TwoFASecret = secret
			return nil
		}
	}
	return service.ErrUserNotFound
}

func (r *inMemoryUserRepository) SetUser2FAStatus(userID string, enabled bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, user := range r.users {
		if user.ID == userID {
			user.TwoFAEnabled = enabled
			return nil
		}
	}
	return service.ErrUserNotFound
}

func (r *inMemoryUserRepository) UploadProfilePicture(userID string, pictureData []byte) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, user := range r.users {
		if user.ID == userID {
			user.ProfilePicture = pictureData
			return nil
		}
	}
	return service.ErrUserNotFound
}



type postgresUserRepository struct {
	db *gorm.DB 
}

func NewPostgresUserRepository(db *gorm.DB) UserRepository {
	if db == nil {
		utils.Log.Fatal("GORM DB instance is nil for PostgresUserRepository.")
	}
	
	err := db.AutoMigrate(&model.User{})
	if err != nil {
		utils.Log.Fatal("Failed to auto migrate User table", zap.Error(err))
	}
	utils.Log.Info("User table auto-migrated successfully.")
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) GetAllUsers() ([]*model.User, error) {
	var users []*model.User
	result := r.db.Find(&users)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to get all users from DB: %w", result.Error)
	}
	return users, nil
}

func (r *postgresUserRepository) CreateUser(user *model.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	

	result := r.db.Create(user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return fmt.Errorf("user creation failed: duplicate key error. %w", result.Error)
		}
		return fmt.Errorf("failed to create user in DB: %w", result.Error)
	}
	utils.Log.Info("User created in PostgreSQL", zap.String("username", user.Username), zap.String("id", user.ID))
	return nil
}

func (r *postgresUserRepository) GetUserByUsername(username string) (*model.User, error) {
	var user model.User
	result := r.db.Where("username = ?", username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, service.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by username from DB: %w", result.Error)
	}
	utils.Log.Info("User found in PostgreSQL", zap.String("username", user.Username))
	return &user, nil
}

func (r *postgresUserRepository) GetUserByID(id string) (*model.User, error) {
	var user model.User
	result := r.db.First(&user, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, service.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by ID from DB: %w", result.Error)
	}
	utils.Log.Info("User found in PostgreSQL by ID", zap.String("id", user.ID))
	return &user, nil
}

func (r *postgresUserRepository) UpdateUser(user *model.User) error {
	user.UpdatedAt = time.Now()
	result := r.db.Model(&model.User{}).Where("id = ?", user.ID).Updates(user)
	if result.Error != nil {
		return fmt.Errorf("failed to update user in DB: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return service.ErrUserNotFound
	}
	utils.Log.Info("User updated in PostgreSQL", zap.String("username", user.Username), zap.String("id", user.ID))
	return nil
}

func (r *postgresUserRepository) DeleteUser(id string) error {
	result := r.db.Delete(&model.User{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete user from DB: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return service.ErrUserNotFound
	}
	utils.Log.Info("User deleted from PostgreSQL", zap.String("id", id))
	return nil
}

func (r *postgresUserRepository) GetUser2FASecret(userID string) (string, error) {
	var user model.User
	result := r.db.Select("two_fa_secret").First(&user, "id = ?", userID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return "", service.ErrUserNotFound
		}
		return "", fmt.Errorf("failed to get 2FA secret from DB: %w", result.Error)
	}
	return user.TwoFASecret, nil
}

func (r *postgresUserRepository) RemoveUser2FASecret(userID string) error {
	result := r.db.Model(&model.User{}).Where("id = ?", userID).Update("two_fa_secret", "")
	if result.Error != nil {
		return fmt.Errorf("failed to remove 2FA secret from DB: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return service.ErrUserNotFound
	}
	return nil
}

func (r *postgresUserRepository) SetUser2FASecret(userID, secret string) error {
	result := r.db.Model(&model.User{}).Where("id = ?", userID).Update("two_fa_secret", secret)
	if result.Error != nil {
		return fmt.Errorf("failed to set 2FA secret in DB: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return service.ErrUserNotFound
	}
	return nil
}

func (r *postgresUserRepository) SetUser2FAStatus(userID string, enabled bool) error {
	result := r.db.Model(&model.User{}).Where("id = ?", userID).Update("two_fa_enabled", enabled)
	if result.Error != nil {
		return fmt.Errorf("failed to set 2FA status in DB: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return service.ErrUserNotFound
	}
	return nil
}

func (r *postgresUserRepository) UploadProfilePicture(userID string, pictureData []byte) error {
	result := r.db.Model(&model.User{}).Where("id = ?", userID).Update("profile_picture", pictureData)
	if result.Error != nil {
		return fmt.Errorf("failed to upload profile picture in DB: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return service.ErrUserNotFound
	}
	return nil
}

// GetUserByEmail returns a user by email from the PostgreSQL database.
func (r *postgresUserRepository) GetUserByEmail(email string) (*model.User, error) {
	var user model.User
	result := r.db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, service.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email from DB: %w", result.Error)
	}
	utils.Log.Info("User found in PostgreSQL by email", zap.String("email", user.Email))
	return &user, nil
}
