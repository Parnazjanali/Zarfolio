package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http/httptest"
	"profile-gold/internal/model"
	"profile-gold/internal/service"
	"profile-gold/internal/utils" // For logger
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

// MockCounterpartyService is a mock for CounterpartyService
type MockCounterpartyService struct {
	mock.Mock
}

func (m *MockCounterpartyService) CreateCounterparty(req *model.Counterparty, userID string) (*model.Counterparty, error) {
	args := m.Called(req, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Counterparty), args.Error(1)
}

func (m *MockCounterpartyService) GetCounterpartyByID(id string, userID string) (*model.Counterparty, error) {
	args := m.Called(id, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Counterparty), args.Error(1)
}

func (m *MockCounterpartyService) ListCounterpartiesByUserID(userID string) ([]model.Counterparty, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]model.Counterparty), args.Error(1)
}

func (m *MockCounterpartyService) UpdateCounterparty(id string, userID string, updateReq *model.Counterparty) (*model.Counterparty, error) {
	args := m.Called(id, userID, updateReq)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Counterparty), args.Error(1)
}

func (m *MockCounterpartyService) DeleteCounterparty(id string, userID string) error {
	args := m.Called(id, userID)
	return args.Error(0)
}

var testCounterpartyHandlerLogger *zap.Logger

// Fiber context injector middleware for tests
func userIDInjectorMiddleware(userID string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Locals("userID", userID)
		return c.Next()
	}
}

func setupCounterpartyHandlerTest() (*CounterpartyHandler, *MockCounterpartyService, *fiber.App) {
	if testCounterpartyHandlerLogger == nil {
		var err error
		testCounterpartyHandlerLogger, err = zap.NewDevelopment()
		if err != nil {
			panic("Failed to create test logger for CounterpartyHandler: " + err.Error())
		}
	}
	if utils.Log == nil { // Ensure global fallback logger is initialized for tests
		utils.InitLoggerForTest() // Assumes this helper exists in utils
	}

	mockCpSvc := new(MockCounterpartyService)
	// The handler expects a non-nil logger.
	cpHandler := NewCounterpartyHandler(mockCpSvc, testCounterpartyHandlerLogger)
	app := fiber.New()

	return cpHandler, mockCpSvc, app
}

// performRequest helper (can be shared among handler tests if generalized)
func performCounterpartyRequest(app *fiber.App, method, target string, body io.Reader) (*httptest.ResponseRecorder, error) {
	req := httptest.NewRequest(method, target, body)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	// For testing protected routes, a middleware would typically handle token validation and set c.Locals("userID").
	// Here, we are unit testing the handler, so we assume userID is already in Locals.
	// The userIDInjectorMiddleware can be used per route for this.
	resp, err := app.Test(req, -1)
	return resp, err
}


func TestCreateCounterparty_Handler_ValidRequest(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()

	// Use middleware to inject userID for this route
	app.Post("/counterparties", userIDInjectorMiddleware("user-test-id"), cpHandler.CreateCounterparty)

	cpReq := model.Counterparty{
		NationalID:  "1234567890",
		FirstName:   "Test",
		LastName:    "User",
		AccountCode: "TU001",
		Debit:       100,
		Credit:      0,
	}
	// The handler clears req.ID and req.UserID, service sets UserID from c.Locals
	// The mock should expect the UserID from c.Locals
	expectedServiceReq := cpReq
	// UserID is not part of the body for create, it's from token.
	// The handler clears ID and UserID from the body if they are sent.
	// The service sets UserID from the context.

	mockCpSvc.On("CreateCounterparty", mock.AnythingOfType("*model.Counterparty"), "user-test-id").Run(func(args mock.Arguments) {
		passedCp := args.Get(0).(*model.Counterparty)
		assert.Equal(t, cpReq.NationalID, passedCp.NationalID) // Check if correct data passed
		assert.Equal(t, cpReq.FirstName, passedCp.FirstName)
	}).Return(&model.Counterparty{ID: "new-cp-id", UserID: "user-test-id", /* ... other fields ...*/}, nil)


	jsonBody, _ := json.Marshal(cpReq)
	resp, err := performCounterpartyRequest(app, "POST", "/counterparties", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusCreated, resp.StatusCode)

	var createdCp model.Counterparty
	err = json.NewDecoder(resp.Body).Decode(&createdCp)
	assert.NoError(t, err)
	assert.Equal(t, "new-cp-id", createdCp.ID)
	mockCpSvc.AssertExpectations(t)
}

func TestCreateCounterparty_Handler_InvalidRequestBody(t *testing.T) {
	cpHandler, _, app := setupCounterpartyHandlerTest() // mockCpSvc not strictly needed if parsing fails
	app.Post("/counterparties", userIDInjectorMiddleware("user-test-id"), cpHandler.CreateCounterparty)

	resp, err := performCounterpartyRequest(app, "POST", "/counterparties", bytes.NewBufferString("invalid-json"))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	// mockCpSvc.AssertNotCalled(t, "CreateCounterparty", mock.Anything, mock.Anything)
}

func TestCreateCounterparty_Handler_ServiceError_Validation(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	app.Post("/counterparties", userIDInjectorMiddleware("user-test-id"), cpHandler.CreateCounterparty)

	cpReq := model.Counterparty{NationalID: "bad-format"} // e.g., invalid national ID
	mockCpSvc.On("CreateCounterparty", mock.AnythingOfType("*model.Counterparty"), "user-test-id").Return(nil, fmt.Errorf("%w: %w", service.ErrCounterpartyValidation, service.ErrInvalidNationalIDFormat))

	jsonBody, _ := json.Marshal(cpReq)
	resp, err := performCounterpartyRequest(app, "POST", "/counterparties", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	mockCpSvc.AssertExpectations(t)
}

func TestCreateCounterparty_Handler_ServiceError_Conflict(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	app.Post("/counterparties", userIDInjectorMiddleware("user-test-id"), cpHandler.CreateCounterparty)

	cpReq := model.Counterparty{NationalID: "1234567890"}
	mockCpSvc.On("CreateCounterparty", mock.AnythingOfType("*model.Counterparty"), "user-test-id").Return(nil, service.ErrNationalIDExists)

	jsonBody, _ := json.Marshal(cpReq)
	resp, err := performCounterpartyRequest(app, "POST", "/counterparties", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusConflict, resp.StatusCode)
	mockCpSvc.AssertExpectations(t)
}


func TestGetCounterparty_Handler_Success(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	app.Get("/counterparties/:id", userIDInjectorMiddleware("user-test-id"), cpHandler.GetCounterparty)

	cpID := "cp-123"
	expectedCp := &model.Counterparty{ID: cpID, UserID: "user-test-id", FirstName: "Found"}
	mockCpSvc.On("GetCounterpartyByID", cpID, "user-test-id").Return(expectedCp, nil)

	resp, err := performCounterpartyRequest(app, "GET", "/counterparties/"+cpID, nil)

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	var resultCp model.Counterparty
	err = json.NewDecoder(resp.Body).Decode(&resultCp)
	assert.NoError(t, err)
	assert.Equal(t, expectedCp.FirstName, resultCp.FirstName)
	mockCpSvc.AssertExpectations(t)
}

func TestGetCounterparty_Handler_NotFound(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	app.Get("/counterparties/:id", userIDInjectorMiddleware("user-test-id"), cpHandler.GetCounterparty)

	cpID := "cp-notfound"
	mockCpSvc.On("GetCounterpartyByID", cpID, "user-test-id").Return(nil, service.ErrCounterpartyNotFound)

	resp, err := performCounterpartyRequest(app, "GET", "/counterparties/"+cpID, nil)

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)
	mockCpSvc.AssertExpectations(t)
}


func TestListCounterparties_Handler_Success(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	app.Get("/counterparties", userIDInjectorMiddleware("user-list-id"), cpHandler.ListCounterparties)

	expectedList := []model.Counterparty{
		{ID: "cp1", UserID: "user-list-id", FirstName: "A"},
		{ID: "cp2", UserID: "user-list-id", FirstName: "B"},
	}
	mockCpSvc.On("ListCounterpartiesByUserID", "user-list-id").Return(expectedList, nil)

	resp, err := performCounterpartyRequest(app, "GET", "/counterparties", nil)

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	var resultList []model.Counterparty
	err = json.NewDecoder(resp.Body).Decode(&resultList)
	assert.NoError(t, err)
	assert.Len(t, resultList, 2)
	mockCpSvc.AssertExpectations(t)
}


func TestUpdateCounterparty_Handler_Success(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	cpID := "cp-update-id"
	userID := "user-updater"
	app.Put("/counterparties/:id", userIDInjectorMiddleware(userID), cpHandler.UpdateCounterparty)

	updateReqPayload := model.Counterparty{FirstName: "UpdatedName"} // Payload from client
	// Service is expected to merge this into existing and return the full updated object
	updatedServiceResponse := &model.Counterparty{ID: cpID, UserID: userID, FirstName: "UpdatedName", AccountCode: "AC001"}

	mockCpSvc.On("UpdateCounterparty", cpID, userID, mock.AnythingOfType("*model.Counterparty")).Run(func(args mock.Arguments){
		passedUpdate := args.Get(2).(*model.Counterparty)
		assert.Equal(t, updateReqPayload.FirstName, passedUpdate.FirstName)
	}).Return(updatedServiceResponse, nil)

	jsonBody, _ := json.Marshal(updateReqPayload)
	resp, err := performCounterpartyRequest(app, "PUT", "/counterparties/"+cpID, bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	var resultCp model.Counterparty
	err = json.NewDecoder(resp.Body).Decode(&resultCp)
	assert.NoError(t, err)
	assert.Equal(t, "UpdatedName", resultCp.FirstName)
	mockCpSvc.AssertExpectations(t)
}

func TestUpdateCounterparty_Handler_ServiceError_NotFound(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	cpID := "cp-update-notfound"
	userID := "user-updater"
	app.Put("/counterparties/:id", userIDInjectorMiddleware(userID), cpHandler.UpdateCounterparty)

	updateReqPayload := model.Counterparty{FirstName: "UpdatedName"}
	mockCpSvc.On("UpdateCounterparty", cpID, userID, mock.AnythingOfType("*model.Counterparty")).Return(nil, service.ErrCounterpartyNotFound)

	jsonBody, _ := json.Marshal(updateReqPayload)
	resp, err := performCounterpartyRequest(app, "PUT", "/counterparties/"+cpID, bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)
	mockCpSvc.AssertExpectations(t)
}


func TestDeleteCounterparty_Handler_Success(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	cpID := "cp-delete-id"
	userID := "user-deleter"
	app.Delete("/counterparties/:id", userIDInjectorMiddleware(userID), cpHandler.DeleteCounterparty)

	mockCpSvc.On("DeleteCounterparty", cpID, userID).Return(nil)

	resp, err := performCounterpartyRequest(app, "DELETE", "/counterparties/"+cpID, nil)

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusNoContent, resp.StatusCode) // Or StatusOK if returning a message
	mockCpSvc.AssertExpectations(t)
}

func TestDeleteCounterparty_Handler_ServiceError_NotFound(t *testing.T) {
	cpHandler, mockCpSvc, app := setupCounterpartyHandlerTest()
	cpID := "cp-delete-notfound"
	userID := "user-deleter"
	app.Delete("/counterparties/:id", userIDInjectorMiddleware(userID), cpHandler.DeleteCounterparty)

	mockCpSvc.On("DeleteCounterparty", cpID, userID).Return(service.ErrCounterpartyNotFound)

	resp, err := performCounterpartyRequest(app, "DELETE", "/counterparties/"+cpID, nil)

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)
	mockCpSvc.AssertExpectations(t)
}


// Helper for utils.Log initialization in tests
// (Similar to what's in other test files, ensure consistency or centralize)
func init() {
    if utils.Log == nil {
        logger, _ := zap.NewDevelopment()
        utils.Log = logger
    }
}

// Ensure this file also has the utils.InitLoggerForTest if that's the chosen pattern
// For example, if utils.InitLoggerForTest is:
/*
package utils
func InitLoggerForTest() {
    if Log == nil {
        logger, _ := zap.NewDevelopment()
        Log = logger
    }
}
*/
// Then call it in setup functions or init(). The current init() above is a direct assignment.
// The current setup uses a local testCounterpartyHandlerLogger and also ensures utils.Log (global) is set.
// This is fine for now.

// Add a test for missing UserID in context if not covered by a general auth middleware test
func TestCreateCounterparty_Handler_MissingUserIDInContext(t *testing.T) {
	cpHandler, _, app := setupCounterpartyHandlerTest()
	// Note: No userIDInjectorMiddleware used here to simulate missing userID
	app.Post("/counterparties_no_auth_ctx", cpHandler.CreateCounterparty)

	cpReq := model.Counterparty{ NationalID: "1234567890" }
	jsonBody, _ := json.Marshal(cpReq)
	resp, err := performCounterpartyRequest(app, "POST", "/counterparties_no_auth_ctx", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

	var errResp model.ErrorResponse
	err = json.NewDecoder(resp.Body).Decode(&errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Message, "Unauthorized: User ID not found")
}

// (Add similar tests for other handlers if userID is critical and not guaranteed by middleware in all test setups)
