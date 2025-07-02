package repository

import (
	"errors"
	"log"
	"sync"
	"time"
	"zarfolio-backend/settings-manager/internal/model"

	"gorm.io/gorm"
)

// PostgresSettingsRepository implements SettingsRepository for PostgreSQL.
type PostgresSettingsRepository struct {
	db *gorm.DB
	// mu is used to ensure that the settings are initialized only once.
	initOnce sync.Once
}

// NewPostgresSettingsRepository creates a new PostgresSettingsRepository.
func NewPostgresSettingsRepository(db *gorm.DB) SettingsRepository {
	return &PostgresSettingsRepository{db: db}
}

// initSettings ensures that there's a default settings record in the database.
// It creates one if it doesn't exist.
func (r *PostgresSettingsRepository) initSettings() error {
	var err error
	r.initOnce.Do(func() {
		var existingSettings model.SystemSettings
		// Try to find the settings record, assuming ID 1 or the first record.
		// Using First() is safer if there's a chance of multiple records, though we expect only one.
		// Or, explicitly look for ID 1 if that's the convention.
		if res := r.db.First(&existingSettings, 1); res.Error != nil {
			if errors.Is(res.Error, gorm.ErrRecordNotFound) {
				log.Println("No settings record found with ID 1, creating default settings...")
				defaultSettings := model.SystemSettings{
					ID:                    1, // Explicitly set ID
					StoreName:             "فروشگاه پیش فرض",
					EconomicCode:          "0000000000",
					PhoneNumber:           "000-0000000",
					FullAddress:           "آدرس پیش فرض",
					BaseCurrency:          "ریال",
					DefaultVatPercentage:  9.0,
					DefaultWagePercentage: 7.0,
					InvoiceHeader:         "به نام خدا",
					InvoiceFooter:         "با تشکر از خرید شما",
					CreatedAt:             time.Now(),
					UpdatedAt:             time.Now(),
				}
				if createErr := r.db.Create(&defaultSettings).Error; createErr != nil {
					log.Printf("Failed to create default settings: %v\n", createErr)
					err = createErr
					return
				}
				log.Println("Default settings created successfully with ID 1.")
			} else {
				log.Printf("Error checking for existing settings: %v\n", res.Error)
				err = res.Error
				return
			}
		} else {
			log.Println("Existing settings record found with ID 1.")
		}
	})
	return err
}

// GetSettings retrieves the system settings.
// It will initialize settings with defaults if they don't exist.
func (r *PostgresSettingsRepository) GetSettings() (*model.SystemSettings, error) {
	if err := r.initSettings(); err != nil {
		return nil, err
	}

	var settings model.SystemSettings
	// Always fetch the record with ID 1, as it's guaranteed to exist by initSettings.
	if err := r.db.First(&settings, 1).Error; err != nil {
		// This should ideally not happen if initSettings was successful.
		log.Printf("Error retrieving settings after init: %v\n", err)
		return nil, err
	}
	return &settings, nil
}

// UpdateSettings updates the system settings.
// It assumes the settings record (ID 1) already exists.
func (r *PostgresSettingsRepository) UpdateSettings(newSettings *model.SystemSettings) (*model.SystemSettings, error) {
	if err := r.initSettings(); err != nil { // Ensure settings are initialized first
		return nil, err
	}

	// We always update the record with ID 1.
	// The incoming newSettings might not have an ID, or it might be different.
	// We force the ID to 1 to ensure we're updating the correct singleton record.
	settingsToUpdate := newSettings
	settingsToUpdate.ID = 1 // Ensure we are updating the correct record.
	
	// GORM's Save will update all fields if primary key is set, or insert if it's zero.
	// Since ID is 1, it will attempt an update.
	// Using .Model and .Where might be safer if newSettings contains a zero ID for some reason
	// and we only want to update certain fields based on the existing record.
	// However, for a full settings update, .Save should be fine.

	// To prevent GORM from trying to update CreatedAt, we can retrieve the existing one.
	var currentSettings model.SystemSettings
	if err := r.db.First(&currentSettings, 1).Error; err == nil {
		settingsToUpdate.CreatedAt = currentSettings.CreatedAt // Preserve original CreatedAt
	} else {
		// This case (record not found) should ideally be handled by initSettings,
		// but as a fallback, set CreatedAt if creating anew (though Save with ID=1 should update).
		settingsToUpdate.CreatedAt = time.Now() 
	}
    settingsToUpdate.UpdatedAt = time.Now()


	// Using .Updates to only update non-zero fields from newSettings onto the record with ID 1.
	// Or, if we want a full replacement of all fields (except primary key and CreatedAt):
	// result := r.db.Model(&model.SystemSettings{}).Where("id = ?", 1).Updates(settingsToUpdate)

	// For a full overwrite as implied by the in-memory version (excluding ID and CreatedAt):
	// We need to load the existing record to preserve CreatedAt, then apply updates.
	
	// Let's use Save which will perform an update because settingsToUpdate.ID is set.
	// GORM will automatically update the UpdatedAt field.
	if err := r.db.Save(settingsToUpdate).Error; err != nil {
		log.Printf("Error updating settings: %v\n", err)
		return nil, err
	}
	
	// Return the updated settings record from the DB to ensure consistency
	var updatedRecord model.SystemSettings
	if err := r.db.First(&updatedRecord, 1).Error; err != nil {
		log.Printf("Error retrieving settings after update: %v\n", err)
		return nil, err
	}
	return &updatedRecord, nil
}
