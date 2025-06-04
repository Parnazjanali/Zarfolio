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
	GetUserByEmail(email string) (*model.User, error)
	GetUserByID(id string) (*model.User, error)
	UpdateUser(user *model.User) error
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

func (r *inMemoryUserRepository) GetUserByID(id string) (*model.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, u := range r.users {
		if u.ID == id {
			utils.Log.Info("User found by ID in in-memory repo", zap.String("userID", id))
			return u, nil
		}
	}
	return nil, ErrUserNotFound
}

func (r *inMemoryUserRepository) UpdateUser(user *model.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	// Check if user exists by ID, as username might be part of the update but ID should be fixed.
	// This also assumes user.Username is the key in r.users map, which might need adjustment if we primarily fetch by ID for updates.
	// For simplicity, let's assume we find the old record by ID, then update it.
	// However, the current map structure `map[string]*model.User` uses username as key.
	// This means we can't directly update a user if their username is also changed, unless we remove old key and add new.
	// A robust in-memory repo might need a map by ID: `usersByID map[string]*model.User`

	// Let's find by username first, assuming username is not changed or is the primary key for map access.
	// If username can be changed, this logic needs to be more complex (e.g. find by ID, then update).
	// For now, if user.Username is the key in r.users:
	if oldUser, exists := r.users[user.Username]; !exists {
		// If not found by current username, try to find by ID to see if it's a username change
		var foundByID *model.User
		var oldUsernameKey string
		for key, u := range r.users {
			if u.ID == user.ID {
				foundByID = u
				oldUsernameKey = key
				break
			}
		}
		if foundByID == nil {
			utils.Log.Warn("UpdateUser: User not found in in-memory repo for update", zap.String("username", user.Username), zap.String("userID", user.ID))
			return ErrUserNotFound
		}
		// If username changed, delete old entry and add new one
		if oldUsernameKey != user.Username {
			delete(r.users, oldUsernameKey)
		}
	}

	user.UpdatedAt = time.Now()
	r.users[user.Username] = user // Replace existing user or add if username changed
	utils.Log.Info("User updated in in-memory repo", zap.String("username", user.Username), zap.String("userID", user.ID))
	return nil
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

func (r *postgresUserRepository) GetUserByID(id string) (*model.User, error) {
	var user model.User
	result := r.db.Where("id = ?", id).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by id from DB: %w", result.Error)
	}
	utils.Log.Info("User found by ID in PostgreSQL", zap.String("userID", user.ID))
	return &user, nil
}

func (r *postgresUserRepository) UpdateUser(user *model.User) error {
	user.UpdatedAt = time.Now()
	// Using Save for full update. This will update all fields of the user struct.
	// If you want to update only specific fields, use .Model(&model.User{ID: user.ID}).Updates(map[string]interface{}{...})
	// For password reset, updating PasswordHash and UpdatedAt is typical.
	// GORM's Save will also update associations if they are loaded and changed.
	// Ensure that the user object passed here is what you intend to save.
	result := r.db.Save(user)
	if result.Error != nil {
		// Check for duplicate key errors if unique constraints are violated during update (e.g., changing email to an existing one)
		// This might require more specific error checking based on your DB driver.
		return fmt.Errorf("failed to update user in DB: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		// This case means no record was found with user.ID to update.
		utils.Log.Warn("UpdateUser: User not found in PostgreSQL for update, or no changes made", zap.String("userID", user.ID))
		return ErrUserNotFound // Or a more specific "update failed, user not found or no data changed"
	}
	utils.Log.Info("User updated in PostgreSQL", zap.String("userID", user.ID))
	return nil
}
