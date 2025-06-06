package service

import (
	"errors"
	"profile-gold/internal/model"
	"profile-gold/internal/utils" // For logger, if not already initialized
	"regexp"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

// MockCounterpartyRepository is a mock type for the CounterpartyRepository
type MockCounterpartyRepository struct {
	mock.Mock
}

func (m *MockCounterpartyRepository) CreateCounterparty(counterparty *model.Counterparty) error {
	args := m.Called(counterparty)
	// Simulate ID generation by DB
	if args.Error(0) == nil && counterparty.ID == "" {
		counterparty.ID = "mock-generated-uuid"
	}
	return args.Error(0)
}

func (m *MockCounterpartyRepository) GetCounterpartyByNationalID(nationalID string, userID string) (*model.Counterparty, error) {
	args := m.Called(nationalID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Counterparty), args.Error(1)
}

func (m *MockCounterpartyRepository) GetCounterpartyByAccountCode(accountCode string, userID string) (*model.Counterparty, error) {
	args := m.Called(accountCode, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Counterparty), args.Error(1)
}

func (m *MockCounterpartyRepository) GetCounterpartyByID(id string, userID string) (*model.Counterparty, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Counterparty), args.Error(1)
}

func (m *MockCounterpartyRepository) ListCounterpartiesByUserID(userID string) ([]model.Counterparty, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]model.Counterparty), args.Error(1)
}

func (m *MockCounterpartyRepository) UpdateCounterparty(counterparty *model.Counterparty) error {
	args := m.Called(counterparty)
	return args.Error(0)
}

func (m *MockCounterpartyRepository) DeleteCounterparty(id string, userID string) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

func (m *MockCounterpartyRepository) CheckNationalIDExists(nationalID string, userID string, currentID string) (bool, error) {
	args := m.Called(nationalID, userID, currentID)
	return args.Bool(0), args.Error(1)
}

func (m *MockCounterpartyRepository) CheckAccountCodeExists(accountCode string, userID string, currentID string) (bool, error) {
	args := m.Called(accountCode, userID, currentID)
	return args.Bool(0), args.Error(1)
}

var testLogger *zap.Logger

func setupServiceTest() (*counterpartyServiceImpl, *MockCounterpartyRepository) {
	if testLogger == nil {
		// Initialize a logger for tests if not already done
		// This might need adjustment based on how utils.Log is initialized in the main app
		tempLogger, err := zap.NewDevelopment()
		if err != nil {
			panic("Failed to create test logger: " + err.Error())
		}
		testLogger = tempLogger
		// If utils.Log is globally used and uninitialized, this might be a place to init it for tests
		// For now, assume NewCounterpartyService handles logger fallback or direct passing
	}

	mockRepo := new(MockCounterpartyRepository)
	// Use utils.Log if your service expects it, or pass testLogger directly
	// For consistency with NewCounterpartyService, let's assume it can take utils.Log or a passed logger.
	// If utils.Log is not initialized by default, then we MUST pass testLogger.
	// The current NewCounterpartyService uses utils.Log as fallback if logger param is nil,
	// but panics if utils.Log itself is also nil.
	// So, better to ensure utils.Log is usable or explicitly pass testLogger.
	if utils.Log == nil { // Quick check, might need more robust setup for utils.Log
	    utils.InitLoggerForTest() // Placeholder for a test logger init function in utils
	}

	service := NewCounterpartyService(mockRepo, testLogger).(*counterpartyServiceImpl)
	return service, mockRepo
}

// Placeholder for a test logger init in utils package
// utils/logger_test_utils.go (or similar)
/*
package utils
func InitLoggerForTest() {
	if Log == nil {
		logger, _ := zap.NewDevelopment()
		Log = logger
	}
}
*/


func TestCreateCounterparty_ValidInput(t *testing.T) {
	service, mockRepo := setupServiceTest()
	cp := &model.Counterparty{
		NationalID:  "1234567890",
		FirstName:   "John",
		LastName:    "Doe",
		AccountCode: "JD001",
	}
	userID := "user-123"

	mockRepo.On("CheckNationalIDExists", cp.NationalID, userID, "").Return(false, nil)
	mockRepo.On("CheckAccountCodeExists", cp.AccountCode, userID, "").Return(false, nil)
	mockRepo.On("CreateCounterparty", mock.AnythingOfType("*model.Counterparty")).Return(nil).Run(func(args mock.Arguments) {
		arg := args.Get(0).(*model.Counterparty)
		arg.ID = "new-uuid" // Simulate DB generating ID
	})


	createdCp, err := service.CreateCounterparty(cp, userID)

	assert.NoError(t, err)
	assert.NotNil(t, createdCp)
	assert.Equal(t, userID, createdCp.UserID)
	assert.Equal(t, "new-uuid", createdCp.ID)
	mockRepo.AssertExpectations(t)
}

func TestCreateCounterparty_InvalidNationalIDFormat(t *testing.T) {
	service, _ := setupServiceTest() // mockRepo not strictly needed for this path
	cp := &model.Counterparty{
		NationalID:  "123", // Invalid
		FirstName:   "John",
		LastName:    "Doe",
		AccountCode: "JD002",
	}
	userID := "user-123"

	_, err := service.CreateCounterparty(cp, userID)

	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrCounterpartyValidation))
	assert.Contains(t, err.Error(), ErrInvalidNationalIDFormat.Error())
}

func TestCreateCounterparty_NationalIDExists(t *testing.T) {
	service, mockRepo := setupServiceTest()
	cp := &model.Counterparty{
		NationalID:  "1234567890",
		FirstName:   "Jane",
		LastName:    "Doe",
		AccountCode: "JD003",
	}
	userID := "user-456"

	mockRepo.On("CheckNationalIDExists", cp.NationalID, userID, "").Return(true, nil)
	// CheckAccountCodeExists and CreateCounterparty should not be called

	_, err := service.CreateCounterparty(cp, userID)

	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrNationalIDExists))
	mockRepo.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "CheckAccountCodeExists", mock.Anything, mock.Anything, mock.Anything)
	mockRepo.AssertNotCalled(t, "CreateCounterparty", mock.Anything)
}

func TestCreateCounterparty_AccountCodeExists(t *testing.T) {
	service, mockRepo := setupServiceTest()
	cp := &model.Counterparty{
		NationalID:  "0987654321",
		FirstName:   "Jim",
		LastName:    "Beam",
		AccountCode: "JB001",
	}
	userID := "user-789"

	mockRepo.On("CheckNationalIDExists", cp.NationalID, userID, "").Return(false, nil)
	mockRepo.On("CheckAccountCodeExists", cp.AccountCode, userID, "").Return(true, nil)
	// CreateCounterparty should not be called

	_, err := service.CreateCounterparty(cp, userID)

	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrAccountCodeExists))
	mockRepo.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "CreateCounterparty", mock.Anything)
}


func TestGetCounterpartyByID_Found(t *testing.T) {
	service, mockRepo := setupServiceTest()
	expectedCp := &model.Counterparty{ID: "cp-1", UserID: "user-1", NationalID: "1111111111"}

	mockRepo.On("GetCounterpartyByID", "cp-1", "user-1").Return(expectedCp, nil)

	cp, err := service.GetCounterpartyByID("cp-1", "user-1")

	assert.NoError(t, err)
	assert.Equal(t, expectedCp, cp)
	mockRepo.AssertExpectations(t)
}

func TestGetCounterpartyByID_NotFound(t *testing.T) {
	service, mockRepo := setupServiceTest()
	mockRepo.On("GetCounterpartyByID", "cp-nonexistent", "user-1").Return(nil, nil) // Repo returns (nil, nil) for not found

	cp, err := service.GetCounterpartyByID("cp-nonexistent", "user-1")

	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrCounterpartyNotFound))
	assert.Nil(t, cp)
	mockRepo.AssertExpectations(t)
}

func TestListCounterpartiesByUserID_Success(t *testing.T) {
	service, mockRepo := setupServiceTest()
	expectedList := []model.Counterparty{
		{ID: "cp-1", UserID: "user-1", NationalID: "1111111111"},
		{ID: "cp-2", UserID: "user-1", NationalID: "2222222222"},
	}
	mockRepo.On("ListCounterpartiesByUserID", "user-1").Return(expectedList, nil)

	list, err := service.ListCounterpartiesByUserID("user-1")

	assert.NoError(t, err)
	assert.Equal(t, expectedList, list)
	mockRepo.AssertExpectations(t)
}

func TestUpdateCounterparty_Success(t *testing.T) {
	service, mockRepo := setupServiceTest()
	userID := "user-1"
	cpID := "cp-to-update"

	existingCp := &model.Counterparty{
		ID: cpID, UserID: userID, NationalID: "1234567890", AccountCode: "AC001", FirstName: "Old", LastName: "Name",
	}
	updateReq := &model.Counterparty{ // Only fields to update are typically sent by handler, service handles merging
		FirstName: "New", LastName: "NameUpdated", NationalID: "0987654321", // New NationalID
	}

	// Expected state after merging updateReq into existingCp by the service
	expectedUpdatedCpAfterMerge := *existingCp // Make a copy
	expectedUpdatedCpAfterMerge.FirstName = updateReq.FirstName
	expectedUpdatedCpAfterMerge.LastName = updateReq.LastName
	expectedUpdatedCpAfterMerge.NationalID = updateReq.NationalID


	mockRepo.On("GetCounterpartyByID", cpID, userID).Return(existingCp, nil)
	mockRepo.On("CheckNationalIDExists", updateReq.NationalID, userID, cpID).Return(false, nil)
	// Assuming AccountCode is not being updated in this test case, so CheckAccountCodeExists won't be called for it.
	// If AccountCode was in updateReq and different, a mock for CheckAccountCodeExists would be needed.
	mockRepo.On("UpdateCounterparty", &expectedUpdatedCpAfterMerge).Return(nil)


	updatedCp, err := service.UpdateCounterparty(cpID, userID, updateReq)

	assert.NoError(t, err)
	assert.NotNil(t, updatedCp)
	assert.Equal(t, "New", updatedCp.FirstName)
	assert.Equal(t, "NameUpdated", updatedCp.LastName)
	assert.Equal(t, "0987654321", updatedCp.NationalID) // Check if NationalID was updated
	mockRepo.AssertExpectations(t)
}


func TestUpdateCounterparty_NationalIDExists(t *testing.T) {
	service, mockRepo := setupServiceTest()
	userID := "user-1"
	cpID := "cp-to-update"
	newNationalID := "0987654321"

	existingCp := &model.Counterparty{
		ID: cpID, UserID: userID, NationalID: "1234567890", AccountCode: "AC001", FirstName: "Old",
	}
	updateReq := &model.Counterparty{NationalID: newNationalID}

	mockRepo.On("GetCounterpartyByID", cpID, userID).Return(existingCp, nil)
	mockRepo.On("CheckNationalIDExists", newNationalID, userID, cpID).Return(true, nil) // Simulate new NationalID already exists

	_, err := service.UpdateCounterparty(cpID, userID, updateReq)

	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrNationalIDExists))
	mockRepo.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "UpdateCounterparty", mock.Anything)
}


func TestDeleteCounterparty_Success(t *testing.T) {
	service, mockRepo := setupServiceTest()
	cpID := "cp-to-delete"
	userID := "user-1"

	// Mock GetCounterpartyByID for the pre-check in service's DeleteCounterparty
	mockRepo.On("GetCounterpartyByID", cpID, userID).Return(&model.Counterparty{ID: cpID, UserID: userID}, nil)
	mockRepo.On("DeleteCounterparty", cpID, userID).Return(nil)

	err := service.DeleteCounterparty(cpID, userID)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestDeleteCounterparty_NotFound(t *testing.T) {
	service, mockRepo := setupServiceTest()
	cpID := "cp-nonexistent"
	userID := "user-1"

	mockRepo.On("GetCounterpartyByID", cpID, userID).Return(nil, nil) // Simulate not found by GetCounterpartyByID pre-check

	err := service.DeleteCounterparty(cpID, userID)

	assert.Error(t, err)
	assert.True(t, errors.Is(err, ErrCounterpartyNotFound))
	mockRepo.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "DeleteCounterparty", mock.Anything, mock.Anything)
}

// Minimal init for utils.Log for test purposes if not already handled by application structure for tests.
// This should ideally be part of a test setup helper or the utils package itself should provide a test-safe way to initialize.
// For now, this is a simplified version.
func (u *utilsPkg) InitLoggerForTest() {
    if u.Log == nil {
        logger, _ := zap.NewDevelopment()
        u.Log = logger
    }
}
var utilsPkgInstance utilsPkg
type utilsPkg struct {
    Log *zap.Logger
    // other utils fields if any, or just use the actual package's Log variable if it's public
}

// This is a bit of a hack to satisfy the test file structure.
// In a real scenario, utils.Log would be initialized by main or a test helper.
func init() {
    if utils.Log == nil {
         l, _ := zap.NewDevelopment()
         utils.Log = l // This directly modifies the package variable. Risky if tests run in parallel and step on each other.
                       // Better to inject logger or have a utils.SetLoggerForTest().
    }
	// nationalIDRegex is already defined in service, but if it were private, it'd be here for testing.
	// For this test, it's fine as is.
	_ = regexp.Compile(`^[0-9]{10}$`) // To use regexp import if other tests don't
	_ = time.Now() // To use time import
}

// Ensure all functions in the mock are implemented if strict checking is on somewhere.
// The current mock definition implements all required methods for the tests written.

/*
Additional test cases to consider for CounterpartyService:
- CreateCounterparty:
    - Missing required fields (FirstName, LastName, AccountCode) -> ErrCounterpartyValidation
    - Repository error during CheckNationalIDExists -> ErrCreateCounterpartyFailed
    - Repository error during CheckAccountCodeExists -> ErrCreateCounterpartyFailed
    - Repository error during CreateCounterparty itself -> ErrCreateCounterpartyFailed
- GetCounterpartyByID:
    - Repository error -> ErrGetCounterpartyFailed
- ListCounterpartiesByUserID:
    - Repository error -> ErrListCounterpartiesFailed
- UpdateCounterparty:
    - Counterparty not found (by GetCounterpartyByID) -> ErrCounterpartyNotFound
    - Invalid NationalID format in updateReq -> ErrCounterpartyValidation
    - AccountCode already exists (and is different from current) -> ErrAccountCodeExists
    - Repository error during GetCounterpartyByID -> ErrUpdateCounterpartyFailed
    - Repository error during CheckNationalIDExists -> ErrUpdateCounterpartyFailed
    - Repository error during CheckAccountCodeExists -> ErrUpdateCounterpartyFailed
    - Repository error during UpdateCounterparty itself -> ErrUpdateCounterpartyFailed
    - Attempting to update with empty NationalID/AccountCode (if these are required and being changed)
- DeleteCounterparty:
    - Repository error during GetCounterpartyByID (pre-check) -> ErrDeleteCounterpartyFailed
    - Repository error during DeleteCounterparty itself -> ErrDeleteCounterpartyFailed
*/
