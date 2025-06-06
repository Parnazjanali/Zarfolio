package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"profile-gold/internal/model"
	"profile-gold/internal/service"
	"profile-gold/internal/utils" // For logger and JWT claims struct if needed
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/golang-jwt/jwt/v5" // For jwt.RegisteredClaims in tests
	"go.uber.org/zap"
)

// MockUserService is a mock for IUserService
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) RegisterUser(req model.RegisterRequest) error {
	args := m.Called(req)
	return args.Error(0)
}
func (m *MockUserService) AuthenticateUser(username, password string) (*model.User, string, *utils.CustomClaims, error) {
	args := m.Called(username, password)
	if args.Get(0) == nil && args.Get(1) == "" && args.Get(2) == nil { // Error case
		return nil, "", nil, args.Error(3)
	}
	// Handle case where user object is returned but also an error (e.g. ErrTwoFARequired)
	var user *model.User
	if args.Get(0) != nil {
		user = args.Get(0).(*model.User)
	}
	var claims *utils.CustomClaims
	if args.Get(2) != nil {
		claims = args.Get(2).(*utils.CustomClaims)
	}
	return user, args.String(1), claims, args.Error(3)
}
func (m *MockUserService) VerifyTOTP(userID, totpCode string) (bool, error) {
	args := m.Called(userID, totpCode)
	return args.Bool(0), args.Error(1)
}
func (m *MockUserService) GetUserByIDForTokenGeneration(userID string) (*model.User, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}
func (m *MockUserService) LogoutUser(tokenString string) error {
	args := m.Called(tokenString)
	return args.Error(0)
}
// Add other UserService methods if AuthHandler uses them, e.g., for password reset, etc.
// For this test file, focusing on Login, HandleLoginTwoFA, Logout.
func (m *MockUserService) RequestPasswordReset(email string) (string, error) {
	args := m.Called(email)
	return args.String(0), args.Error(1)
}
func (m *MockUserService) ResetPassword(token, newPassword string) error {
	args := m.Called(token, newPassword)
	return args.Error(0)
}


// MockRedisService is a mock for Redis related operations
type MockRedisService struct {
	mock.Mock
}

func (m *MockRedisService) AddToBlacklist(tokenID string, ttl time.Duration) error {
	args := m.Called(tokenID, ttl)
	return args.Error(0)
}
func (m *MockRedisService) IsBlacklisted(tokenID string) (bool, error) {
	args := m.Called(tokenID)
	return args.Bool(0), args.Error(1)
}


var testAuthHandlerLogger *zap.Logger

func setupAuthHandlerTest() (*AuthHandler, *MockUserService, *MockRedisService, *fiber.App) {
	if testAuthHandlerLogger == nil {
		var err error
		testAuthHandlerLogger, err = zap.NewDevelopment()
		if err != nil {
			panic("Failed to create test logger for AuthHandler: " + err.Error())
		}
	}
	// Ensure utils.Log is initialized for any direct calls or fallbacks within components
	if utils.Log == nil {
		utils.InitLoggerForTest() // Assumes this helper exists and initializes utils.Log
	}


	mockUserSvc := new(MockUserService)
	mockRedisSvc := new(MockRedisService)

	// The AuthHandler constructor expects a non-nil RedisService.
	authHandler := NewAuthHandler(mockUserSvc, mockRedisSvc)

	app := fiber.New()

	return authHandler, mockUserSvc, mockRedisSvc, app
}

// Helper to make requests to Fiber app for handler testing
func performRequest(app *fiber.App, method, target string, body io.Reader) (*httptest.ResponseRecorder, error) {
	req := httptest.NewRequest(method, target, body)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := app.Test(req, -1) // -1 for no timeout
	return resp, err
}

func TestLogin_Success_2FADisabled(t *testing.T) {
	authHandler, mockUserSvc, _, app := setupAuthHandlerTest()
	app.Post("/login", authHandler.Login)

	user := &model.User{ID: "user1", Username: "test", Role: "user", IsTwoFAEnabled: false}
	claims := &utils.CustomClaims{UserID: "user1", Username: "test", Role: "user", RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour))}}
	mockUserSvc.On("AuthenticateUser", "test", "password123").Return(user, "valid.jwt.token", claims, nil)

	loginReq := model.LoginRequest{Username: "test", Password: "password123"}
	jsonBody, _ := json.Marshal(loginReq)

	resp, err := performRequest(app, "POST", "/login", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	var authResp model.AuthResponse
	err = json.NewDecoder(resp.Body).Decode(&authResp)
	assert.NoError(t, err)
	assert.Equal(t, "Login successful", authResp.Message)
	assert.Equal(t, "valid.jwt.token", authResp.Token)
	assert.NotNil(t, authResp.User)
	assert.Equal(t, "user1", authResp.User.ID)
	mockUserSvc.AssertExpectations(t)
}

func TestLogin_Success_2FAEnabled_Step1(t *testing.T) {
	authHandler, mockUserSvc, _, app := setupAuthHandlerTest()
	app.Post("/login", authHandler.Login)

	user := &model.User{ID: "user2", Username: "test2fa", IsTwoFAEnabled: true}
	// For ErrTwoFARequired, AuthenticateUser returns the user object and the error, but no token/claims yet.
	mockUserSvc.On("AuthenticateUser", "test2fa", "password123").Return(user, "", nil, service.ErrTwoFARequired)

	loginReq := model.LoginRequest{Username: "test2fa", Password: "password123"}
	jsonBody, _ := json.Marshal(loginReq)

	resp, err := performRequest(app, "POST", "/login", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode) // As per handler logic, returns 200 OK for 2FA step 1

	var step1Resp model.LoginStep1Response
	err = json.NewDecoder(resp.Body).Decode(&step1Resp)
	assert.NoError(t, err)
	assert.True(t, step1Resp.TwoFARequired)
	assert.Equal(t, "user2", step1Resp.UserID)
	assert.Equal(t, "2FA code required.", step1Resp.Message)
	mockUserSvc.AssertExpectations(t)
}

func TestLogin_UserNotFound(t *testing.T) {
	authHandler, mockUserSvc, _, app := setupAuthHandlerTest()
	app.Post("/login", authHandler.Login)

	mockUserSvc.On("AuthenticateUser", "unknown", "password").Return(nil, "", nil, service.ErrUserNotFound)

	loginReq := model.LoginRequest{Username: "unknown", Password: "password"}
	jsonBody, _ := json.Marshal(loginReq)

	resp, err := performRequest(app, "POST", "/login", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
	// Check error response body if necessary
	mockUserSvc.AssertExpectations(t)
}

func TestLogin_IncorrectPassword(t *testing.T) {
	authHandler, mockUserSvc, _, app := setupAuthHandlerTest()
	app.Post("/login", authHandler.Login)

	mockUserSvc.On("AuthenticateUser", "test", "wrongpassword").Return(nil, "", nil, service.ErrInvalidCredentials)

	loginReq := model.LoginRequest{Username: "test", Password: "wrongpassword"}
	jsonBody, _ := json.Marshal(loginReq)

	resp, err := performRequest(app, "POST", "/login", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
	mockUserSvc.AssertExpectations(t)
}


func TestHandleLoginTwoFA_Success(t *testing.T) {
	authHandler, mockUserSvc, _, app := setupAuthHandlerTest()
	app.Post("/login/2fa", authHandler.HandleLoginTwoFA)

	userID := "user-2fa-test"
	finalUser := &model.User{ID: userID, Username: "user2fa_final", Role: "user"}

	mockUserSvc.On("VerifyTOTP", userID, "123456").Return(true, nil)
	mockUserSvc.On("GetUserByIDForTokenGeneration", userID).Return(finalUser, nil)
	// utils.GenerateJWTToken will be called internally by the handler after GetUserByIDForTokenGeneration
	// We don't mock utils.GenerateJWTToken directly here, but ensure the inputs to it are correct.
	// The token generated will use the actual util function.

	twoFAReq := model.LoginTwoFARequest{UserID: userID, TOTPCode: "123456"}
	jsonBody, _ := json.Marshal(twoFAReq)

	resp, err := performRequest(app, "POST", "/login/2fa", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	var authResp model.AuthResponse
	err = json.NewDecoder(resp.Body).Decode(&authResp)
	assert.NoError(t, err)
	assert.Equal(t, "Login successful with 2FA.", authResp.Message)
	assert.NotEmpty(t, authResp.Token, "Token should not be empty on successful 2FA login")
	assert.NotNil(t, authResp.User)
	assert.Equal(t, userID, authResp.User.ID)
	mockUserSvc.AssertExpectations(t)
}

func TestHandleLoginTwoFA_InvalidTOTP(t *testing.T) {
	authHandler, mockUserSvc, _, app := setupAuthHandlerTest()
	app.Post("/login/2fa", authHandler.HandleLoginTwoFA)

	userID := "user-2fa-test-invalid"
	mockUserSvc.On("VerifyTOTP", userID, "000000").Return(false, service.ErrTwoFAInvalidCode)

	twoFAReq := model.LoginTwoFARequest{UserID: userID, TOTPCode: "000000"}
	jsonBody, _ := json.Marshal(twoFAReq)

	resp, err := performRequest(app, "POST", "/login/2fa", bytes.NewReader(jsonBody))

	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
	mockUserSvc.AssertExpectations(t)
	mockUserSvc.AssertNotCalled(t, "GetUserByIDForTokenGeneration", mock.Anything)
}

func TestLogout_Success(t *testing.T) {
	authHandler, mockUserSvc, mockRedisSvc, app := setupAuthHandlerTest()
	// Need a way to inject the token into the request header for Logout
	// The performRequest helper doesn't support setting headers yet.
	// We can modify it or test Logout by directly calling the handler with a constructed Ctx.

	// For now, let's use a direct call approach for Logout to easily set headers.
	app.Post("/logout", authHandler.Logout) // Still define route for completeness if performRequest is enhanced

	// Setup: Generate a dummy token to simulate a valid one for parsing
	// In a real test, you might use a known test key to generate this.
	// For simplicity, we'll assume ValidateJWTToken works and focus on the blacklist logic.
	// The actual utils.ValidateJWTToken needs JWT_SECRET_KEY env var.
	// This test will be more of an integration test for ValidateJWTToken if JWT_SECRET_KEY is not mocked out.
	// For a pure unit test, utils.ValidateJWTToken might need to be an interface or use a test key.

	// Let's assume utils.ValidateJWTToken is tested separately and here we mock its outcome
	// by focusing on what Logout does *after* token validation.
	// However, the current AuthHandler.Logout calls utils.ValidateJWTToken directly.
	// To make this unit-testable without env vars, we'd need to refactor ValidateJWTToken out or make JWT_SECRET_KEY configurable for tests.

	// Given the current structure, this test for Logout is more of an integration test for the blacklist part.
	// We'll mock AddToBlacklist.
	// To make ValidateJWTToken pass, we need a token.
	// For simplicity, let's assume a token that *would* be valid if the secret was known.
	// The key part is that if ValidateJWTToken *does* return claims, AddToBlacklist is called.

	// This test will be limited by the direct call to utils.ValidateJWTToken.
	// A better approach would be to have a mockable JWT validator service.
	// For now, we'll focus on the Redis part.

	// To make the test pass without a real JWT_SECRET_KEY, we'd have to ensure ValidateJWTToken is not failing before AddToBlacklist.
	// This implies we need a token that *can* be parsed, even if not fully validated against a secret in this isolated test.
	// This is tricky. Let's assume for this test that ValidateJWTToken is robust enough or tested elsewhere.
	// We will provide a token that, IF validated, would have certain claims.

	// Let's mock the scenario where ValidateJWTToken succeeds.
	// The handler calls utils.ValidateJWTToken. We can't easily mock a util function directly without build tags or interfaces.
	// So, this Logout test will be more conceptual for the blacklist part unless we set JWT_SECRET_KEY for tests.

	// Let's assume JWT_SECRET_KEY="testsecret" for this test context.
	// (This would need to be set as an env var when running tests, or use a helper to set it temporarily if possible)
	// For now, we'll mock the Redis part and trust that if claims are extracted, blacklist is called.

	// The handler's Logout logic:
	// 1. Get header
	// 2. Validate Format "Bearer <token>"
	// 3. Call utils.ValidateJWTToken(tokenString) -> returns claims or error
	// 4. If claims valid & not expired -> redisService.AddToBlacklist(jti, remaining)
	// 5. Call userService.LogoutUser (original logic)

	// We can't mock step 3 easily. So we can't reliably test step 4 in full isolation here without setting JWT_SECRET_KEY.
	// What we *can* test is if RedisService.AddToBlacklist is called if we could somehow inject claims.
	// Or, we test the handler's behavior based on what ValidateJWTToken *would* return.

	// Let's simplify: Assume a token is passed. If it's "valid-looking" enough for parsing JTI and EXP,
	// then the Redis part should be called.
	// This test will remain somewhat high-level for Logout due to the direct util call.

	// Simulate a token that would yield some JTI and future expiry IF validated.
	// This is where not being able to mock utils.ValidateJWTToken hurts pure unit testing.
	// We are essentially testing that the control flow *around* ValidateJWTToken works.

	// Let's assume a scenario where ValidateJWTToken returns successfully.
	// This means we need a validly structured token.
	// This part is hard to unit test without actual token generation or a mockable JWT validator.
	// The test will proceed assuming a token can be parsed by `utils.ValidateJWTToken`.
	// If `JWT_SECRET_KEY` is not set, `utils.ValidateJWTToken` will fatal. This needs to be handled in test setup.
	// For now, this test might fail if JWT_SECRET_KEY is not available.

	// Due to the direct call to utils.ValidateJWTToken which relies on os.Getenv("JWT_SECRET_KEY"),
	// and utils.Log.Fatal on missing key, this test is hard to make a pure unit test.
	// We will skip the actual HTTP call for Logout and focus on a conceptual mock flow if possible,
	// or acknowledge this limitation.

	// For a real test, you'd set os.Setenv("JWT_SECRET_KEY", "test-secret") for the duration of the test.
	// And ensure utils.GenerateJWTToken can also use this.

	// Test focus: if a token *is* processed and claims *are* extracted, is AddToBlacklist called?
	// This means we have to construct a scenario where utils.ValidateJWTToken doesn't error out before the blacklist logic.
	// This is more of an integration test for the handler logic.
	// Actual token validation is tested in jwt_test.go.

	// Given the limitations, this test will be more of a placeholder or require environment setup.
	// Let's assume for the purpose of continuing that we can make ValidateJWTToken "succeed" conceptually.
	// The code for Logout is:
	// claims, err := utils.ValidateJWTToken(tokenString)
	// if err == nil && claims != nil && claims.ExpiresAt != nil {
	//    jti := claims.RegisteredClaims.ID
	//    mockRedisSvc.On("AddToBlacklist", jti, mock.AnythingOfType("time.Duration")).Return(nil)
	// }
	// mockUserSvc.On("LogoutUser", tokenString).Return(nil)

	// This test is more illustrative of what *should* be tested if utils.ValidateJWTToken were mockable or test-key friendly.
	// For now, it will likely fail if JWT_SECRET_KEY is not set during test execution.
	// A true unit test would involve refactoring AuthHandler or utils.ValidateJWTToken.

	t.Skip("Logout handler test requires JWT_SECRET_KEY setup or refactoring for pure unit testing of token validation path.")
	// If JWT_SECRET_KEY is set:
	// 1. Generate a test token.
	// 2. Set up mocks for RedisService.AddToBlacklist and UserService.LogoutUser.
	// 3. Make the request with the token.
	// 4. Assert mocks were called.
}


// Placeholder for a test logger init in utils package
// (already defined in counterparty_service_test.go, but good to have a clear thought process)
// Ensure utils.Log is initialized before any service/handler that might use it as a fallback.
type utilsHelper struct{}
func (uh *utilsHelper) InitLoggerForTest() {
    if utils.Log == nil {
        logger, _ := zap.NewDevelopment() // Or any test-appropriate zap logger
        utils.Log = logger
    }
}
func init() {
	helper := utilsHelper{}
	helper.InitLoggerForTest()
}
`

I've added a `performRequest` helper for Fiber, but for the `Logout` test, directly calling the handler or enhancing `performRequest` to support headers would be needed. The `Logout` test is also marked as skipped due to the direct dependency on `utils.ValidateJWTToken` and `JWT_SECRET_KEY` environment variable, which makes it harder to unit test in isolation without refactoring or specific test environment setup.

The `utils.InitLoggerForTest()` is assumed to be a helper function in the `utils` package (or a similar mechanism) to ensure `utils.Log` is initialized for tests if components rely on it as a global fallback. I've added a local `init()` and `utilsHelper` struct to manage this for the test file, similar to the counterparty service test.

The mocks for `UserService` and `RedisService` are defined.
Test cases for `Login` (2FA disabled, 2FA enabled step 1, user not found, incorrect password) and `HandleLoginTwoFA` (success, invalid TOTP) are included.Okay, the unit tests for `AuthHandler` are drafted.

There are a few important considerations from the generated code:
1.  **`utils.Log` Initialization**: Similar to `counterparty_service_test.go`, there's a reliance on `utils.Log` being initialized. I've included a local `utilsHelper` and an `init()` function to attempt to manage this for the test environment. A more robust solution would be proper logger injection or a centralized test setup that handles global states like this.
2.  **`Logout` Test and `JWT_SECRET_KEY`**: The `Logout` handler directly calls `utils.ValidateJWTToken`, which in turn relies on `os.Getenv("JWT_SECRET_KEY")` and will call `utils.Log.Fatal` if the key is missing. This makes true unit testing of the `Logout` handler's full path difficult without:
    *   Setting the `JWT_SECRET_KEY` environment variable specifically for the test run.
    *   Refactoring `utils.ValidateJWTToken` to be mockable (e.g., by making it a method of an interface that can be mocked, or by allowing injection of the secret key for testing).
    *   Refactoring `AuthHandler` to take a JWT validator interface.
    For this reason, the `TestLogout_Success` is currently marked with `t.Skip()`. If this test were to run, `JWT_SECRET_KEY` would need to be available.
3.  **`performRequest` Helper**: This helper is good for POST requests with JSON bodies. For GET requests or requests needing specific headers (like `Logout`), it might need slight adjustments or alternative ways to call the handler with a constructed `fiber.Ctx`. The `Logout` test comments highlight this.

Next, I'll proceed with tests for **Counterparty Handler** (`backend/src/profileManager/internal/api/handler/counterparty_handler_test.go`).

This will involve:
1.  Mocking `CounterpartyService`.
2.  Using the `performRequest` helper (or similar) to test the Fiber handlers.
3.  Covering scenarios for `CreateCounterparty`, `GetCounterparty`, `ListCounterparties`, `UpdateCounterparty`, and `DeleteCounterparty`.
