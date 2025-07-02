package postgresDb

import (
	"encoding/json"
	"fmt"
	"os"
	"profile-gold/internal/model"
	"profile-gold/internal/utils"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

type AdminSeedData struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func SeedAdminUser(db *gorm.DB) error {
	adminJSON, err := os.ReadFile("configs/admin_user.json")
	if err != nil {
		if os.IsNotExist(err) {
			utils.Log.Warn("admin_user.json not found, skipping admin user seeding.")
			return nil
		}
		utils.Log.Error("Failed to read admin_user.json", zap.Error(err))
		return fmt.Errorf("failed to read admin config: %w", err)
	}

	var adminData AdminSeedData
	if err := json.Unmarshal(adminJSON, &adminData); err != nil {
		utils.Log.Error("Failed to unmarshal admin_user.json", zap.Error(err))
		return fmt.Errorf("failed to parse admin config: %w", err)
	}

	// Check if an admin user already exists
	var existingUser model.User
	if err := db.Where("username = ? OR email = ?", adminData.Username, adminData.Email).First(&existingUser).Error; err == nil {
		utils.Log.Info("Admin user already exists, skipping seed.", zap.String("username", adminData.Username))
		return nil
	} else if err != gorm.ErrRecordNotFound {
		utils.Log.Error("Failed to check for existing admin user", zap.Error(err))
		return fmt.Errorf("db error checking for admin: %w", err)
	}

	hashedPassword, err := utils.HashPassword(adminData.Password)
	if err != nil {
		utils.Log.Error("Failed to hash admin password during seeding", zap.Error(err))
		return err
	}

	adminUser := &model.User{
		Username:     adminData.Username,
		Email:        adminData.Email,
		PasswordHash: hashedPassword,
		Role:         model.Role(adminData.Role), // ✅ **اصلاح اصلی:** تبدیل نوع به model.Role
	}

	if err := db.Create(adminUser).Error; err != nil {
		utils.Log.Error("Failed to seed admin user", zap.Error(err))
		return fmt.Errorf("failed to create admin user in db: %w", err)
	}

	utils.Log.Info("Admin user seeded successfully.", zap.String("username", adminData.Username))
	return nil
}