// settings-manager/internal/repository/settings_repo.go

package repository

import (
	"errors"
	"zarfolio-backend/settings-manager/internal/model"
)

// SettingsRepository handles the database operations for settings.
// For this example, we use an in-memory store instead of a real database.
type SettingsRepository struct {
	// In a real application, this would hold a database connection pool, e.g., *sql.DB
	inMemoryStore *model.BusinessInfo
}

// NewSettingsRepository creates a new instance of the repository.
func NewSettingsRepository() *SettingsRepository {
	// Initialize with some default data
	return &SettingsRepository{
		inMemoryStore: &model.BusinessInfo{
			ID:           1,
			StoreName:    "فروشگاه پیش‌فرض",
			Address:      "آدرس پیش‌فرض",
			PhoneNumber:  "021-00000000",
			EconomicCode: "000000000000",
			LogoURL:      "",
		},
	}
}

// GetBusinessInfo retrieves the current business information.
func (r *SettingsRepository) GetBusinessInfo() (*model.BusinessInfo, error) {
	if r.inMemoryStore == nil {
		return nil, errors.New("business information not found")
	}
	return r.inMemoryStore, nil
}

// UpdateBusinessInfo saves the updated business information.
func (r *SettingsRepository) UpdateBusinessInfo(info *model.BusinessInfo) error {
	if info == nil {
		return errors.New("cannot save nil information")
	}
	// In a real database, you would execute an UPDATE query here.
	// e.g., "UPDATE business_info SET store_name = ?, ... WHERE id = 1"
	r.inMemoryStore = info
	return nil
}