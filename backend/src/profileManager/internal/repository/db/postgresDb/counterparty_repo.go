package postgresDb

import (
	"errors"
	"profile-gold/internal/model"
	"profile-gold/internal/utils"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// CounterpartyRepository defines the interface for interacting with counterparty data.
// We define an interface to allow for easier testing and mocking.
type CounterpartyRepository interface {
	CreateCounterparty(cp *model.Counterparty) error
	GetCounterpartyByNationalID(nationalID string) (*model.Counterparty, error)
	GetCounterpartyByAccountCode(accountCode string) (*model.Counterparty, error)
	// Add other methods here if needed in the future, e.g., ListCounterparties, UpdateCounterparty
}

// GormCounterpartyRepository is an implementation of CounterpartyRepository using GORM.
type GormCounterpartyRepository struct {
	db *gorm.DB
}

// NewGormCounterpartyRepository creates a new GormCounterpartyRepository.
func NewGormCounterpartyRepository(db *gorm.DB) CounterpartyRepository {
	if db == nil {
		utils.Log.Fatal("Database instance is nil in NewGormCounterpartyRepository")
	}
	return &GormCounterpartyRepository{db: db}
}

// CreateCounterparty creates a new counterparty record in the database.
func (r *GormCounterpartyRepository) CreateCounterparty(cp *model.Counterparty) error {
	if cp == nil {
		return errors.New("counterparty model cannot be nil")
	}
	utils.Log.Info("Attempting to create counterparty", zap.String("nationalID", cp.NationalID), zap.String("accountCode", cp.AccountCode))

	result := r.db.Create(cp)
	if result.Error != nil {
		utils.Log.Error("Failed to create counterparty", zap.Error(result.Error), zap.String("nationalID", cp.NationalID))
		return result.Error
	}
	if result.RowsAffected == 0 {
		utils.Log.Warn("CreateCounterparty operation resulted in no rows affected", zap.String("nationalID", cp.NationalID))
		return errors.New("create counterparty failed: no rows affected")
	}
	utils.Log.Info("Counterparty created successfully", zap.String("id", cp.ID))
	return nil
}

// GetCounterpartyByNationalID retrieves a counterparty by their National ID.
// Returns gorm.ErrRecordNotFound if no record is found.
func (r *GormCounterpartyRepository) GetCounterpartyByNationalID(nationalID string) (*model.Counterparty, error) {
	if nationalID == "" {
		return nil, errors.New("nationalID cannot be empty")
	}
	var counterparty model.Counterparty
	utils.Log.Info("Querying for counterparty by National ID", zap.String("nationalID", nationalID))

	err := r.db.Where("national_id = ?", nationalID).First(&counterparty).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.Log.Info("No counterparty found with National ID", zap.String("nationalID", nationalID))
		} else {
			utils.Log.Error("Error querying counterparty by National ID", zap.Error(err), zap.String("nationalID", nationalID))
		}
		return nil, err
	}
	utils.Log.Info("Counterparty found by National ID", zap.String("id", counterparty.ID), zap.String("nationalID", nationalID))
	return &counterparty, nil
}

// GetCounterpartyByAccountCode retrieves a counterparty by their Account Code.
// Returns gorm.ErrRecordNotFound if no record is found.
func (r *GormCounterpartyRepository) GetCounterpartyByAccountCode(accountCode string) (*model.Counterparty, error) {
	if accountCode == "" {
		return nil, errors.New("accountCode cannot be empty")
	}
	var counterparty model.Counterparty
	utils.Log.Info("Querying for counterparty by Account Code", zap.String("accountCode", accountCode))

	err := r.db.Where("account_code = ?", accountCode).First(&counterparty).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.Log.Info("No counterparty found with Account Code", zap.String("accountCode", accountCode))
		} else {
			utils.Log.Error("Error querying counterparty by Account Code", zap.Error(err), zap.String("accountCode", accountCode))
		}
		return nil, err
	}
	utils.Log.Info("Counterparty found by Account Code", zap.String("id", counterparty.ID), zap.String("accountCode", accountCode))
	return &counterparty, nil
}
