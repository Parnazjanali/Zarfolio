package service

import (
	"errors"
	"fmt"
	"profile-gold/internal/model"
	"profile-gold/internal/repository"
	"profile-gold/internal/utils" // For logging and potentially validation helpers
	"regexp"

	"go.uber.org/zap"
	"gorm.io/gorm" // Added for gorm.ErrRecordNotFound
)

var (
	ErrCounterpartyNotFound         = errors.New("counterparty not found")
	ErrCounterpartyValidation       = errors.New("counterparty validation failed")
	ErrNationalIDExists             = errors.New("national ID already exists for this user")
	ErrAccountCodeExists            = errors.New("account code already exists for this user")
	ErrInvalidNationalIDFormat      = errors.New("national ID must be 10 numeric digits")
	ErrCreateCounterpartyFailed     = errors.New("failed to create counterparty")
	ErrUpdateCounterpartyFailed     = errors.New("failed to update counterparty")
	ErrDeleteCounterpartyFailed     = errors.New("failed to delete counterparty")
	ErrGetCounterpartyFailed        = errors.New("failed to retrieve counterparty")
	ErrListCounterpartiesFailed     = errors.New("failed to list counterparties")
	ErrCounterpartyForbidden        = errors.New("user does not have permission to access this counterparty") // Though repo layer mostly handles UserID scoping
)

// nationalIDRegex defines the expected format for NationalID (10 digits).
var nationalIDRegex = regexp.MustCompile(`^[0-9]{10}$`)

// CounterpartyService defines the interface for counterparty business logic.
type CounterpartyService interface {
	CreateCounterparty(req *model.Counterparty, userID string) (*model.Counterparty, error)
	GetCounterpartyByID(id string, userID string) (*model.Counterparty, error)
	ListCounterpartiesByUserID(userID string) ([]model.Counterparty, error)
	UpdateCounterparty(id string, userID string, updateReq *model.Counterparty) (*model.Counterparty, error)
	DeleteCounterparty(id string, userID string) error
}

type counterpartyServiceImpl struct {
	repo   repository.CounterpartyRepository
	logger *zap.Logger
}

// NewCounterpartyService creates a new CounterpartyService.
func NewCounterpartyService(repo repository.CounterpartyRepository, logger *zap.Logger) CounterpartyService {
	if repo == nil {
		panic("CounterpartyRepository cannot be nil for CounterpartyService")
	}
	if logger == nil {
		// Fallback or panic, consistent with other services
		if utils.Log == nil {
			panic("Logger is nil and utils.Log is not initialized for CounterpartyService")
		}
		logger = utils.Log
	}
	return &counterpartyServiceImpl{repo: repo, logger: logger}
}

// validateNationalID checks if the NationalID is valid.
func (s *counterpartyServiceImpl) validateNationalID(nationalID string) error {
	if !nationalIDRegex.MatchString(nationalID) {
		return ErrInvalidNationalIDFormat
	}
	return nil
}

// CreateCounterparty handles the business logic for creating a new counterparty.
func (s *counterpartyServiceImpl) CreateCounterparty(req *model.Counterparty, userID string) (*model.Counterparty, error) {
	s.logger.Debug("Attempting to create counterparty", zap.String("userID", userID), zap.Any("request", req))

	if err := s.validateNationalID(req.NationalID); err != nil {
		return nil, fmt.Errorf("%w: %w", ErrCounterpartyValidation, err)
	}
	if req.FirstName == "" || req.LastName == "" || req.AccountCode == "" {
		return nil, fmt.Errorf("%w: first name, last name, and account code are required", ErrCounterpartyValidation)
	}

	req.UserID = userID // Ensure UserID is set correctly

	// Check for uniqueness of NationalID for this user
	exists, err := s.repo.CheckNationalIDExists(req.NationalID, userID, "")
	if err != nil {
		s.logger.Error("Error checking NationalID existence during create", zap.Error(err), zap.String("nationalID", req.NationalID), zap.String("userID", userID))
		return nil, ErrCreateCounterpartyFailed
	}
	if exists {
		return nil, ErrNationalIDExists
	}

	// Check for uniqueness of AccountCode for this user
	exists, err = s.repo.CheckAccountCodeExists(req.AccountCode, userID, "")
	if err != nil {
		s.logger.Error("Error checking AccountCode existence during create", zap.Error(err), zap.String("accountCode", req.AccountCode), zap.String("userID", userID))
		return nil, ErrCreateCounterpartyFailed
	}
	if exists {
		return nil, ErrAccountCodeExists
	}

	// Simple AccountCode generation/assignment (if not provided or needs prefix)
	// For now, we assume AccountCode is provided and validated for uniqueness.
	// Example: if req.AccountCode == "" { req.AccountCode = generateSimpleAccountCode() }


	if err := s.repo.CreateCounterparty(req); err != nil {
		s.logger.Error("Failed to create counterparty in repository", zap.Error(err), zap.String("userID", userID))
		return nil, ErrCreateCounterpartyFailed
	}
	s.logger.Info("Counterparty created successfully", zap.String("counterpartyID", req.ID), zap.String("userID", userID))
	return req, nil
}

// GetCounterpartyByID retrieves a counterparty by its ID, ensuring it belongs to the user.
func (s *counterpartyServiceImpl) GetCounterpartyByID(id string, userID string) (*model.Counterparty, error) {
	s.logger.Debug("Attempting to get counterparty by ID", zap.String("id", id), zap.String("userID", userID))
	counterparty, err := s.repo.GetCounterpartyByID(id, userID)
	if err != nil {
		s.logger.Error("Error fetching counterparty by ID from repository", zap.Error(err), zap.String("id", id), zap.String("userID", userID))
		return nil, ErrGetCounterpartyFailed
	}
	if counterparty == nil {
		return nil, ErrCounterpartyNotFound // Or ErrCounterpartyForbidden if we want to be less specific about existence
	}
	return counterparty, nil
}

// ListCounterpartiesByUserID retrieves all counterparties for a given user.
func (s *counterpartyServiceImpl) ListCounterpartiesByUserID(userID string) ([]model.Counterparty, error) {
	s.logger.Debug("Attempting to list counterparties for user", zap.String("userID", userID))
	counterparties, err := s.repo.ListCounterpartiesByUserID(userID)
	if err != nil {
		s.logger.Error("Error listing counterparties from repository", zap.Error(err), zap.String("userID", userID))
		return nil, ErrListCounterpartiesFailed
	}
	return counterparties, nil
}

// UpdateCounterparty handles updating an existing counterparty.
func (s *counterpartyServiceImpl) UpdateCounterparty(id string, userID string, updateReq *model.Counterparty) (*model.Counterparty, error) {
	s.logger.Debug("Attempting to update counterparty", zap.String("id", id), zap.String("userID", userID), zap.Any("updateRequest", updateReq))

	existingCp, err := s.repo.GetCounterpartyByID(id, userID)
	if err != nil {
		s.logger.Error("Error fetching counterparty for update", zap.Error(err), zap.String("id", id), zap.String("userID", userID))
		return nil, ErrUpdateCounterpartyFailed
	}
	if existingCp == nil {
		return nil, ErrCounterpartyNotFound
	}

	// Apply updates - only update fields that are meant to be updatable
	// For example, UserID should not change. ID is already fixed.
	if updateReq.NationalID != "" && existingCp.NationalID != updateReq.NationalID {
		if err := s.validateNationalID(updateReq.NationalID); err != nil {
			return nil, fmt.Errorf("%w: %w", ErrCounterpartyValidation, err)
		}
		exists, err := s.repo.CheckNationalIDExists(updateReq.NationalID, userID, id) // Pass 'id' to exclude self
		if err != nil {
			s.logger.Error("Error checking NationalID existence during update", zap.Error(err), zap.String("nationalID", updateReq.NationalID), zap.String("userID", userID))
			return nil, ErrUpdateCounterpartyFailed
		}
		if exists {
			return nil, ErrNationalIDExists
		}
		existingCp.NationalID = updateReq.NationalID
	}

	if updateReq.AccountCode != "" && existingCp.AccountCode != updateReq.AccountCode {
		exists, err := s.repo.CheckAccountCodeExists(updateReq.AccountCode, userID, id) // Pass 'id' to exclude self
		if err != nil {
			s.logger.Error("Error checking AccountCode existence during update", zap.Error(err), zap.String("accountCode", updateReq.AccountCode), zap.String("userID", userID))
			return nil, ErrUpdateCounterpartyFailed
		}
		if exists {
			return nil, ErrAccountCodeExists
		}
		existingCp.AccountCode = updateReq.AccountCode
	}

	if updateReq.FirstName != "" {
		existingCp.FirstName = updateReq.FirstName
	}
	if updateReq.LastName != "" {
		existingCp.LastName = updateReq.LastName
	}
	// Assuming Debit and Credit are absolute values, not incremental.
	// Service layer could also handle logic like "cannot change debit/credit if transactions exist" etc.
	if updateReq.Debit != existingCp.Debit { // Check if actually changed to avoid unnecessary db write if only field in payload
		existingCp.Debit = updateReq.Debit
	}
	if updateReq.Credit != existingCp.Credit {
		existingCp.Credit = updateReq.Credit
	}

	// Ensure UserID is not being changed
	existingCp.UserID = userID

	if err := s.repo.UpdateCounterparty(existingCp); err != nil {
		s.logger.Error("Failed to update counterparty in repository", zap.Error(err), zap.String("id", id), zap.String("userID", userID))
		return nil, ErrUpdateCounterpartyFailed
	}
	s.logger.Info("Counterparty updated successfully", zap.String("counterpartyID", existingCp.ID), zap.String("userID", userID))
	return existingCp, nil
}

// DeleteCounterparty handles deleting a counterparty.
func (s *counterpartyServiceImpl) DeleteCounterparty(id string, userID string) error {
	s.logger.Debug("Attempting to delete counterparty", zap.String("id", id), zap.String("userID", userID))
	// First, check if it exists and belongs to the user (repo also does this, but good for service layer too)
	cp, err := s.repo.GetCounterpartyByID(id, userID)
	if err != nil {
		s.logger.Error("Error fetching counterparty for deletion check", zap.Error(err), zap.String("id", id), zap.String("userID", userID))
		return ErrDeleteCounterpartyFailed
	}
	if cp == nil {
		return ErrCounterpartyNotFound // Or ErrCounterpartyForbidden
	}

	if err := s.repo.DeleteCounterparty(id, userID); err != nil {
		s.logger.Error("Failed to delete counterparty in repository", zap.Error(err), zap.String("id", id), zap.String("userID", userID))
		// Differentiate between not found (already handled by GetCounterpartyByID) and other errors
		if errors.Is(err, gorm.ErrRecordNotFound) { // Should not happen if Get works
			return ErrCounterpartyNotFound
		}
		return ErrDeleteCounterpartyFailed
	}
	s.logger.Info("Counterparty deleted successfully", zap.String("counterpartyID", id), zap.String("userID", userID))
	return nil
}
