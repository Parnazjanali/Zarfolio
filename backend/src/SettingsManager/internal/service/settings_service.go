// settings-manager/internal/service/settings_service.go

package service

import (
	"zarfolio-backend/settings-manager/internal/model"
	"zarfolio-backend/settings-manager/internal/repository"
)

// SettingsService provides the business logic for managing settings.
type SettingsService struct {
	repo *repository.SettingsRepository
}

// NewSettingsService creates a new service instance.
func NewSettingsService(repo *repository.SettingsRepository) *SettingsService {
	return &SettingsService{repo: repo}
}

// GetBusinessInfo retrieves business information.
func (s *SettingsService) GetBusinessInfo() (*model.BusinessInfo, error) {
	// You can add business logic here, e.g., logging, validation, etc.
	return s.repo.GetBusinessInfo()
}

// UpdateBusinessInfo validates and updates business information.
func (s *SettingsService) UpdateBusinessInfo(info *model.BusinessInfo) error {
	// Here you can perform complex validation before saving.
	// For now, we just pass it to the repository.
	return s.repo.UpdateBusinessInfo(info)
}