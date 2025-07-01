// backend/src/SettingsManager/internal/service/settings_service.go
package service

import (
	"zarfolio-backend/settings-manager/internal/model"
	"zarfolio-backend/settings-manager/internal/repository"
)

type SettingsService struct {
	repo repository.SettingsRepository
}

func NewSettingsService(repo repository.SettingsRepository) *SettingsService {
	return &SettingsService{repo: repo}
}

func (s *SettingsService) GetSettings() (*model.SystemSettings, error) {
	return s.repo.GetSettings()
}

func (s *SettingsService) UpdateSettings(settings *model.SystemSettings) (*model.SystemSettings, error) {
	return s.repo.UpdateSettings(settings)
}