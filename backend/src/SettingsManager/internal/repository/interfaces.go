package repository

import (
	"zarfolio-backend/settings-manager/internal/model"
)

// SettingsRepository defines the interface for settings persistence.
type SettingsRepository interface {
	GetSettings() (*model.SystemSettings, error)
	UpdateSettings(settings *model.SystemSettings) (*model.SystemSettings, error)
}
