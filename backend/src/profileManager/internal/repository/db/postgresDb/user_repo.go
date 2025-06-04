package postgresDb

import (
	"errors"
	"fmt"
	"profile-gold/internal/model"
	"profile-gold/internal/utils"
	"sync"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	
	ErrUserNotFound = errors.New("user not found")
	ErrTokenNotFound = errors.New("token not found in blacklist")
)


type UserRepository interface {
	CreateUser(user *model.User) error
	GetUserByUsername(username string) (*model.User, error)
	GetUserByEmail(email string) (*model.User, error) // Add this line
	// GetUserByID(id string) (*model.User, error) // (بعدا)
	// UpdateUser(user *model.User) error // (بعدا)
	// DeleteUser(id string) error // (بعدا)
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

func (r *inMemoryUserRepository) GetUserByUsername(username string) (*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, ok := r.users[username]
	if !ok {
		return nil, ErrUserNotFound
	}
	utils.Log.Info("User found in in-memory repo", zap.String("username", user.Username))
	return user, nil
}

func (r *inMemoryUserRepository) GetUserByEmail(email string) (*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, user := range r.users {
		if user.Email == email {
			utils.Log.Info("User found by email in in-memory repo", zap.String("email", email), zap.String("username", user.Username))
			return user, nil
		}
	}
	return nil, ErrUserNotFound
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
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by username from DB: %w", result.Error)
	}
	utils.Log.Info("User found in PostgreSQL", zap.String("username", user.Username))
	return &user, nil
}

func (r *postgresUserRepository) GetUserByEmail(email string) (*model.User, error) {
	var user model.User
	result := r.db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email from DB: %w", result.Error)
	}
	utils.Log.Info("User found by email in PostgreSQL", zap.String("email", user.Email), zap.String("username", user.Username))
	return &user, nil
}
