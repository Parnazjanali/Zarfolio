package postgresDb

import (
	"errors"
	"fmt"
	"strings" // این پکیج برای بررسی متن خطا اضافه شده است
	"time"

	"profile-gold/internal/model"
	"profile-gold/internal/utils"

	"go.uber.org/zap"
)

var ErrUserAlreadyExists = errors.New("user already exists")

func SeedAdminUsers(userRepo UserRepository) error {
	utils.Log.Info("Starting database seeding for admin users...")

	adminUsers := []struct {
		Username string
		Password string
		Email    string
		Role     string
	}{
		{Username: "admin_user1", Password: "admin_pass1", Email: "admin1@example.com", Role: "admin"},
		{Username: "admin_user2", Password: "admin_pass2", Email: "admin2@example.com", Role: "admin"},
	}

	for _, adminData := range adminUsers {
		// این بخش برای بررسی اولیه نام کاربری خوب است و می‌تواند باقی بماند
		_, err := userRepo.GetUserByUsername(adminData.Username)
		if err == nil {
			utils.Log.Info("Admin user already exists, skipping seed", zap.String("username", adminData.Username))
			continue
		}
		if !errors.Is(err, ErrUserNotFound) {
			utils.Log.Error("Error checking existence of admin user during seed", zap.String("username", adminData.Username), zap.Error(err))
			return fmt.Errorf("seed failed: error checking existing user %s: %w", adminData.Username, err)
		}

		hashedPassword, err := utils.HashPassword(adminData.Password)
		if err != nil {
			utils.Log.Error("Failed to hash password for admin seed", zap.String("username", adminData.Username), zap.Error(err))
			return fmt.Errorf("seed failed: failed to hash password for %s: %w", adminData.Username, err)
		}

		adminToCreate := &model.User{
			Username:     adminData.Username,
			PasswordHash: hashedPassword,
			Email:        adminData.Email,
			Role:         adminData.Role,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		err = userRepo.CreateUser(adminToCreate)
		if err != nil {

			if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "duplicate key") {
				utils.Log.Warn("User with this username or email already exists (duplicate key error), skipping seed",
					zap.String("username", adminData.Username),
					zap.String("email", adminData.Email))
				continue
			}

			utils.Log.Error("Failed to create admin user during seed", zap.String("username", adminData.Username), zap.Error(err))
			return fmt.Errorf("seed failed: failed to create admin user %s: %w", adminData.Username, err)
		}

		utils.Log.Info("Admin user seeded successfully", zap.String("username", adminData.Username), zap.String("role", adminData.Role))
	}

	utils.Log.Info("Database seeding for admin users completed.")
	return nil
}
