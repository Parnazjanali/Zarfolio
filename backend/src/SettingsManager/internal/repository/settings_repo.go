// backend/src/SettingsManager/internal/repository/settings_repo.go
package repository

import (
	"sync"
	"zarfolio-backend/settings-manager/internal/model"
)

// SettingsRepository defines the interface for settings persistence.
type SettingsRepository interface {
	GetSettings() (*model.SystemSettings, error)
	UpdateSettings(settings *model.SystemSettings) (*model.SystemSettings, error)
}

// inMemorySettingsRepository is an in-memory implementation of SettingsRepository.
type inMemorySettingsRepository struct {
	mu       sync.RWMutex
	settings *model.SystemSettings
}

// NewSettingsRepository creates and initializes a new in-memory repository.
func NewSettingsRepository() SettingsRepository {
	// Initialize with some default data.
	// In a real app, this would be loaded from a database.
	defaultSettings := &model.SystemSettings{
		ID:                    1,
		StoreName:             "فروشگاه طلا و جواهر شما",
		EconomicCode:          "۱۲۳۴۵۶۷۸۹۰",
		PhoneNumber:           "۰۲۱-۱۲۳۴۵۶۷۸",
		FullAddress:           "تهران، میدان اصلی، خیابان فرعی، پلاک ۱۰",
		BaseCurrency:          "ریال",
		DefaultVatPercentage:  9.0,
		DefaultWagePercentage: 7.0,
		InvoiceHeader:         "به نام خدا",
		InvoiceFooter:         "از خرید شما متشکریم! www.example.com",
	}
	return &inMemorySettingsRepository{
		settings: defaultSettings,
	}
}

func (r *inMemorySettingsRepository) GetSettings() (*model.SystemSettings, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	// Return a copy to prevent modification of the original object outside of the repo
	s := *r.settings
	return &s, nil
}

func (r *inMemorySettingsRepository) UpdateSettings(newSettings *model.SystemSettings) (*model.SystemSettings, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	// In a real database, you would use an "UPDATE" query.
	// Here, we just replace the in-memory object.
	// We keep the ID and CreatedAt from the old settings.
	newSettings.ID = r.settings.ID
	newSettings.CreatedAt = r.settings.CreatedAt
	r.settings = newSettings
	return r.settings, nil
}