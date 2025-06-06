package repository

import (
	"errors"
	"profile-gold/internal/model"
	"profile-gold/internal/utils" // For logging

	"gorm.io/gorm"
	"go.uber.org/zap"
)

// CounterpartyRepository defines the interface for counterparty data operations.
type CounterpartyRepository interface {
	CreateCounterparty(counterparty *model.Counterparty) error
	GetCounterpartyByNationalID(nationalID string, userID string) (*model.Counterparty, error)
	GetCounterpartyByAccountCode(accountCode string, userID string) (*model.Counterparty, error)
	GetCounterpartyByID(id string, userID string) (*model.Counterparty, error)
	ListCounterpartiesByUserID(userID string) ([]model.Counterparty, error)
	UpdateCounterparty(counterparty *model.Counterparty) error
	DeleteCounterparty(id string, userID string) error
	CheckNationalIDExists(nationalID string, userID string, currentID string) (bool, error)
	CheckAccountCodeExists(accountCode string, userID string, currentID string) (bool, error)
}

// GormCounterpartyRepository implements CounterpartyRepository using GORM.
type GormCounterpartyRepository struct {
	db *gorm.DB
}

// NewGormCounterpartyRepository creates a new GormCounterpartyRepository.
func NewGormCounterpartyRepository(db *gorm.DB) *GormCounterpartyRepository {
	if db == nil {
		utils.Log.Fatal("Database instance cannot be nil for GormCounterpartyRepository")
	}
	return &GormCounterpartyRepository{db: db}
}

// CreateCounterparty adds a new counterparty to the database.
func (r *GormCounterpartyRepository) CreateCounterparty(counterparty *model.Counterparty) error {
	if err := r.db.Create(counterparty).Error; err != nil {
		utils.Log.Error("Failed to create counterparty", zap.Error(err), zap.Any("counterparty", counterparty))
		return err
	}
	return nil
}

// GetCounterpartyByNationalID retrieves a counterparty by their National ID and UserID.
func (r *GormCounterpartyRepository) GetCounterpartyByNationalID(nationalID string, userID string) (*model.Counterparty, error) {
	var counterparty model.Counterparty
	err := r.db.Where("national_id = ? AND user_id = ?", nationalID, userID).First(&counterparty).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil for not found, service layer can handle specific error
		}
		utils.Log.Error("Error fetching counterparty by NationalID", zap.String("nationalID", nationalID), zap.String("userID", userID), zap.Error(err))
		return nil, err
	}
	return &counterparty, nil
}

// GetCounterpartyByAccountCode retrieves a counterparty by their Account Code and UserID.
func (r *GormCounterpartyRepository) GetCounterpartyByAccountCode(accountCode string, userID string) (*model.Counterparty, error) {
	var counterparty model.Counterparty
	err := r.db.Where("account_code = ? AND user_id = ?", accountCode, userID).First(&counterparty).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil for not found
		}
		utils.Log.Error("Error fetching counterparty by AccountCode", zap.String("accountCode", accountCode), zap.String("userID", userID), zap.Error(err))
		return nil, err
	}
	return &counterparty, nil
}

// GetCounterpartyByID retrieves a counterparty by their ID and UserID.
func (r *GormCounterpartyRepository) GetCounterpartyByID(id string, userID string) (*model.Counterparty, error) {
	var counterparty model.Counterparty
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&counterparty).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil for not found
		}
		utils.Log.Error("Error fetching counterparty by ID", zap.String("id", id), zap.String("userID", userID), zap.Error(err))
		return nil, err
	}
	return &counterparty, nil
}

// ListCounterpartiesByUserID retrieves all counterparties associated with a UserID.
func (r *GormCounterpartyRepository) ListCounterpartiesByUserID(userID string) ([]model.Counterparty, error) {
	var counterparties []model.Counterparty
	err := r.db.Where("user_id = ?", userID).Find(&counterparties).Error
	if err != nil {
		utils.Log.Error("Error listing counterparties by UserID", zap.String("userID", userID), zap.Error(err))
		return nil, err
	}
	return counterparties, nil
}

// UpdateCounterparty updates an existing counterparty's details in the database.
// Note: This updates all fields of the provided counterparty struct.
// Ensure the UserID in the counterparty struct matches the one it's supposed to belong to,
// or handle UserID protection in the service layer.
func (r *GormCounterpartyRepository) UpdateCounterparty(counterparty *model.Counterparty) error {
	// The .Save method will update all fields if primary key is present, or create if not.
	// We expect ID to be present for an update.
	// UserID check should be done in service layer to ensure user is not changing owner.
	if counterparty.ID == "" {
		return errors.New("cannot update counterparty without ID")
	}
	err := r.db.Save(counterparty).Error
	if err != nil {
		utils.Log.Error("Failed to update counterparty", zap.Error(err), zap.String("counterpartyID", counterparty.ID))
		return err
	}
	return nil
}

// DeleteCounterparty removes a counterparty from the database by ID and UserID.
func (r *GormCounterpartyRepository) DeleteCounterparty(id string, userID string) error {
	// First, verify the counterparty exists and belongs to the user.
	// This also prevents deleting arbitrary IDs if not owned by user.
	var counterparty model.Counterparty
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&counterparty).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.Log.Warn("Attempt to delete non-existent or unauthorized counterparty", zap.String("id", id), zap.String("userID", userID))
			return gorm.ErrRecordNotFound // Or a custom error like ErrNotFoundOrUnauthorized
		}
		utils.Log.Error("Error finding counterparty for deletion", zap.String("id", id), zap.String("userID", userID), zap.Error(err))
		return err
	}

	if err := r.db.Delete(&model.Counterparty{}, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		utils.Log.Error("Failed to delete counterparty", zap.Error(err), zap.String("id", id), zap.String("userID", userID))
		return err
	}
	return nil
}

// CheckNationalIDExists checks if a NationalID already exists for a given UserID, excluding a specific counterparty ID (for updates).
func (r *GormCounterpartyRepository) CheckNationalIDExists(nationalID string, userID string, currentID string) (bool, error) {
	var count int64
	query := r.db.Model(&model.Counterparty{}).Where("national_id = ? AND user_id = ?", nationalID, userID)
	if currentID != "" { // Exclude current counterparty being updated
		query = query.Where("id <> ?", currentID)
	}
	err := query.Count(&count).Error
	if err != nil {
		utils.Log.Error("Error checking NationalID existence", zap.String("nationalID", nationalID), zap.String("userID", userID), zap.String("currentID", currentID), zap.Error(err))
		return false, err
	}
	return count > 0, nil
}

// CheckAccountCodeExists checks if an AccountCode already exists for a given UserID, excluding a specific counterparty ID (for updates).
func (r *GormCounterpartyRepository) CheckAccountCodeExists(accountCode string, userID string, currentID string) (bool, error) {
	var count int64
	query := r.db.Model(&model.Counterparty{}).Where("account_code = ? AND user_id = ?", accountCode, userID)
	if currentID != "" { // Exclude current counterparty being updated
		query = query.Where("id <> ?", currentID)
	}
	err := query.Count(&count).Error
	if err != nil {
		utils.Log.Error("Error checking AccountCode existence", zap.String("accountCode", accountCode), zap.String("userID", userID), zap.String("currentID", currentID), zap.Error(err))
		return false, err
	}
	return count > 0, nil
}
