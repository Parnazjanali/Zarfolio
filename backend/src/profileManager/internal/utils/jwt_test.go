package utils

import (
	"os"
	"profile-gold/internal/model"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

const testSecretKey = "test-jwt-secret-key-for-unit-tests"

// Helper to set up the environment for JWT tests
func setupJWTTest(t *testing.T) {
	// In Go 1.17+, use t.Setenv for automatic cleanup
	// For older versions, manually manage os.Setenv and os.Unsetenv or os.Clearenv

	// If using Go < 1.17, you might do:
	originalSecret, originalSet := os.LookupEnv("JWT_SECRET_KEY")
	os.Setenv("JWT_SECRET_KEY", testSecretKey)

	// Initialize logger if not already (some util functions might log)
	if Log == nil {
		logger, _ := zap.NewDevelopment() // Or a NopLogger if no output is desired
		Log = logger
	}

	// Teardown function to restore original environment
	t.Cleanup(func() {
		if originalSet {
			os.Setenv("JWT_SECRET_KEY", originalSecret)
		} else {
			os.Unsetenv("JWT_SECRET_KEY")
		}
	})
}


func TestGenerateJWTToken_Success(t *testing.T) {
	setupJWTTest(t)

	user := &model.User{
		ID:       "user-" + uuid.NewString(),
		Username: "testuser",
		Role:     "user",
	}

	tokenString, claims, err := GenerateJWTToken(user)

	assert.NoError(t, err)
	assert.NotEmpty(t, tokenString)
	assert.NotNil(t, claims)

	assert.Equal(t, user.ID, claims.UserID)
	assert.Equal(t, user.Username, claims.Username)
	assert.Equal(t, user.Role, claims.Role)
	assert.NotEmpty(t, claims.RegisteredClaims.ID, "JTI should be generated")
	assert.WithinDuration(t, time.Now().Add(24*time.Hour), claims.ExpiresAt.Time, 5*time.Second, "Expiration time should be approx 24 hours from now")
	assert.WithinDuration(t, time.Now(), claims.IssuedAt.Time, 5*time.Second, "IssuedAt time should be approx now")
}

func TestValidateJWTToken_ValidToken(t *testing.T) {
	setupJWTTest(t)

	user := &model.User{ID: "user-valid", Username: "validuser", Role: "tester"}
	tokenString, _, err := GenerateJWTToken(user)
	assert.NoError(t, err, "Token generation should succeed for validation test")

	parsedClaims, err := ValidateJWTToken(tokenString)

	assert.NoError(t, err)
	assert.NotNil(t, parsedClaims)
	assert.Equal(t, user.ID, parsedClaims.UserID)
	assert.Equal(t, user.Username, parsedClaims.Username)
	assert.Equal(t, user.Role, parsedClaims.Role)
	assert.NotEmpty(t, parsedClaims.RegisteredClaims.ID) // JTI
}

func TestValidateJWTToken_ExpiredToken(t *testing.T) {
	setupJWTTest(t)

	// Generate a token that expired in the past
	expiredClaims := &CustomClaims{
		UserID:   "user-expired",
		Username: "expiredUser",
		Role:     "guest",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expired 1 hour ago
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			ID:        uuid.NewString(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
	expiredTokenString, err := token.SignedString([]byte(testSecretKey))
	assert.NoError(t, err, "Failed to sign expired token for test")

	_, err = ValidateJWTToken(expiredTokenString)

	assert.Error(t, err, "Validation should fail for an expired token")
	// The error returned by jwt/v5 when a token is expired is jwt.ErrTokenExpired
	// ValidateJWTToken wraps this, so we might check for that or the wrapped error.
	// Our ValidateJWTToken returns jwt.ErrTokenExpired directly if claims.ExpiresAt.Before(time.Now())
	assert.True(t, errors.Is(err, jwt.ErrTokenExpired) || strings.Contains(err.Error(), jwt.ErrTokenExpired.Error()), "Error should be or wrap jwt.ErrTokenExpired")
}

func TestValidateJWTToken_InvalidSignature(t *testing.T) {
	setupJWTTest(t)

	user := &model.User{ID: "user-sig", Username: "siguser", Role: "dev"}
	tokenString, _, err := GenerateJWTToken(user) // Signed with testSecretKey
	assert.NoError(t, err, "Token generation failed")

	// Attempt to validate with a slightly modified token (tampered) or a token signed by a different key
	// Easiest way to simulate this is to parse it with a different key, but ValidateJWTToken uses the env var.
	// So, we can try to parse the generated token with a different key here to show the concept,
	// or modify the token string slightly.

	// Scenario 1: Token signed with a different key
	claimsForOtherKey := &CustomClaims{UserID: "user-other", RegisteredClaims: jwt.RegisteredClaims{ID: uuid.NewString(), ExpiresAt: jwt.NewNumericDate(time.Now().Add(1*time.Hour))}}
	otherToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claimsForOtherKey)
	tokenSignedWithDifferentKey, _ := otherToken.SignedString([]byte("another-secret-key-altogether"))

	_, err = ValidateJWTToken(tokenSignedWithDifferentKey)
	assert.Error(t, err, "Validation should fail for token signed with a different key")
	assert.True(t, errors.Is(err, jwt.ErrTokenSignatureInvalid) || strings.Contains(err.Error(), "signature is invalid"), "Error should indicate invalid signature")

	// Scenario 2: Tampered token (less direct to test without reconstructing parts)
	// If we just append garbage, it might fail parsing before signature validation.
	// e.g., ValidateJWTToken(tokenString + "tamper")
	// This often results in ErrTokenMalformed.
	_, errMalformed := ValidateJWTToken(tokenString + "tamper")
	assert.Error(t, errMalformed)
	assert.True(t, errors.Is(errMalformed, jwt.ErrTokenMalformed) || strings.Contains(errMalformed.Error(), "token is malformed"), "Error should indicate malformed token")

}

func TestValidateJWTToken_MalformedToken(t *testing.T) {
	setupJWTTest(t)

	malformedToken := "this.is.not.a.valid.jwt.token"
	_, err := ValidateJWTToken(malformedToken)

	assert.Error(t, err, "Validation should fail for a malformed token")
	// Error might be jwt.ErrTokenMalformed or a parsing error from the library.
	// The current ValidateJWTToken wraps it, so it should contain relevant info.
	assert.True(t, errors.Is(err, jwt.ErrTokenMalformed) || strings.Contains(err.Error(), "token is malformed"), "Error should indicate malformed token")
}


func TestGenerateJWTToken_MissingSecretKey(t *testing.T) {
	// Unset JWT_SECRET_KEY for this specific test
	originalSecret, originalSet := os.LookupEnv("JWT_SECRET_KEY")
	os.Unsetenv("JWT__SECRET_KEY") // Intentionally make it unlikely to be set
	// Crucially, ensure Log does not fatal in test mode, or this test is uncatchable.
	// This requires that utils.Log.Fatal is mockable or configured for tests not to exit.
	// The current implementation of GenerateJWTToken calls utils.Log.Fatal.
	// This test demonstrates a scenario that's hard to unit test perfectly without such mocking.

	// If Log.Fatal actually os.Exit, this test will stop all tests.
	// A common practice is for Log.Fatal to call panic in test mode.
	// For now, this test is more of a design note.

	t.Cleanup(func() {
		if originalSet {
			os.Setenv("JWT_SECRET_KEY", originalSecret)
		} else {
			// If it was originally unset, ensure it remains so (or restore previous state)
			// For simplicity here, just restoring if it was set.
		}
		// Need to restore the original Log behavior if it was changed for this test too.
	})

	// This test might not run as expected if utils.Log.Fatal calls os.Exit.
	// It's commented out unless Log behavior is test-friendly.
	/*
	user := &model.User{ID: "user-no-secret", Username: "nosecretuser", Role: "none"}

	// We'd need to recover from a panic if Log.Fatal panics in test mode
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("GenerateJWTToken should have panicked or errored on missing JWT_SECRET_KEY")
		}
	}()

	_, _, err := GenerateJWTToken(user)
	// If Log.Fatal doesn't panic but returns error (ideal for testing), then:
	// assert.Error(t, err)
	// assert.Contains(t, err.Error(), "JWT_SECRET_KEY environment variable is not set")
	*/
	t.Skip("Skipping test for missing secret key due to Log.Fatal behavior. Requires Log to be mockable/test-friendly.")
}

// init for logger, similar to other test files
func init() {
    if Log == nil { // Log is the package variable from utils.
        logger, err := zap.NewDevelopment()
        if err != nil {
            panic("Failed to init logger for jwt_test: " + err.Error())
        }
        Log = logger
    }
}
