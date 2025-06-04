package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"net/url"
	"os"
	"strings"

	"github.com/pquerna/otp/totp" // totp also includes otp general types
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// --- Encryption Key Management ---

var encryptionKey []byte

// GetEncryptionKey retrieves the master encryption key.
// It fetches PROFILE_MANAGER_2FA_ENCRYPTION_KEY from environment variables.
// The key MUST be 32 bytes for AES-256.
// This function will call Log.Fatal if the key is not set or not 32 bytes.
func GetEncryptionKey() []byte {
	if encryptionKey != nil {
		return encryptionKey
	}
	envKey := os.Getenv("PROFILE_MANAGER_2FA_ENCRYPTION_KEY")
	if envKey == "" {
		Log.Fatal("PROFILE_MANAGER_2FA_ENCRYPTION_KEY environment variable not set. This is required for 2FA secret encryption.")
	}

	// Attempt to hex decode if it looks like a hex string, otherwise use raw bytes.
	// This provides flexibility in how the key is stored in the env var.
	var keyBytes []byte
	var err error
	if strings.HasPrefix(envKey, "0x") || len(envKey) == 64 { // Common for hex, or raw 64 char hex
		keyBytes, err = hex.DecodeString(strings.TrimPrefix(envKey, "0x"))
		if err != nil {
			Log.Fatal("Failed to hex decode PROFILE_MANAGER_2FA_ENCRYPTION_KEY. Ensure it is a valid hex string if that's the intended format.", zap.Error(err))
		}
	} else {
		keyBytes = []byte(envKey)
	}

	if len(keyBytes) != 32 {
		Log.Fatal("PROFILE_MANAGER_2FA_ENCRYPTION_KEY must be 32 bytes for AES-256.", zap.Int("actual_length", len(keyBytes)))
	}
	encryptionKey = keyBytes
	Log.Info("Successfully loaded 2FA encryption key.")
	return encryptionKey
}

// --- AES-GCM Encryption/Decryption ---

// Encrypt uses AES-GCM to encrypt plaintext.
// The key must be 32 bytes (AES-256).
// The nonce is prepended to the ciphertext. Output is hex-encoded.
func Encrypt(plaintext string, key []byte) (string, error) {
	if len(key) != 32 {
		Log.Error("Encryption key must be 32 bytes for AES-256.", zap.Int("key_length", len(key)))
		return "", errors.New("encryption key must be 32 bytes for AES-256")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		Log.Error("Failed to create AES cipher for encryption.", zap.Error(err))
		return "", fmt.Errorf("failed to create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		Log.Error("Failed to create GCM mode for encryption.", zap.Error(err))
		return "", fmt.Errorf("failed to create GCM mode: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = rand.Read(nonce); err != nil {
		Log.Error("Failed to generate nonce for encryption.", zap.Error(err))
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(ciphertext), nil
}

// Decrypt uses AES-GCM to decrypt ciphertext previously encrypted with Encrypt.
// The key must be 32 bytes (AES-256).
// Expects hex-encoded ciphertext with nonce prepended.
func Decrypt(ciphertextHex string, key []byte) (string, error) {
	if len(key) != 32 {
		Log.Error("Decryption key must be 32 bytes for AES-256.", zap.Int("key_length", len(key)))
		return "", errors.New("decryption key must be 32 bytes for AES-256")
	}

	ciphertext, err := hex.DecodeString(ciphertextHex)
	if err != nil {
		Log.Error("Failed to hex decode ciphertext for decryption.", zap.Error(err), zap.String("ciphertext_prefix", ciphertextHex[:min(len(ciphertextHex), 10)]))
		return "", fmt.Errorf("failed to hex decode ciphertext: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		Log.Error("Failed to create AES cipher for decryption.", zap.Error(err))
		return "", fmt.Errorf("failed to create AES cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		Log.Error("Failed to create GCM mode for decryption.", zap.Error(err))
		return "", fmt.Errorf("failed to create GCM mode: %w", err)
	}

	if len(ciphertext) < gcm.NonceSize() {
		Log.Error("Ciphertext too short to contain nonce.", zap.Int("ciphertext_length", len(ciphertext)), zap.Int("nonce_size", gcm.NonceSize()))
		return "", errors.New("ciphertext too short")
	}

	nonce, encryptedMessage := ciphertext[:gcm.NonceSize()], ciphertext[gcm.NonceSize():]

	plaintextBytes, err := gcm.Open(nil, nonce, encryptedMessage, nil)
	if err != nil {
		Log.Warn("Failed to decrypt message with GCM (likely incorrect key or tampered ciphertext).", zap.Error(err))
		return "", fmt.Errorf("failed to decrypt message: %w", err) // Don't reveal too much detail to client
	}

	return string(plaintextBytes), nil
}

// --- TOTP Generation and Validation ---

// defaultOTPAppIssuer is the default issuer name for TOTP.
const defaultOTPAppIssuer = "ProfileGoldApp"

// GenerateTOTPSecret generates a new TOTP secret for a user.
// It uses the username to form the account name in the OTP configuration.
func GenerateTOTPSecret(username string) (string, error) {
	// Consider making Issuer and other GenerateOpts configurable if needed.
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      defaultOTPAppIssuer, // Name of your application
		AccountName: username,            // Typically the user's email or username
	})
	if err != nil {
		Log.Error("Failed to generate TOTP secret.", zap.String("username", username), zap.Error(err))
		return "", fmt.Errorf("failed to generate TOTP secret: %w", err)
	}
	return key.Secret(), nil
}

// GenerateTOTPQRCodeURL generates the otpauth:// URL for QR code generation.
// It takes the issuer name, username (account name), and the TOTP secret.
// This function essentially formats the URL that `key.URL()` from `pquerna/otp` would provide.
func GenerateTOTPQRCodeURL(issuer, username, secret string) string {
	// Ensure the secret is properly base32 encoded if it's not already.
	// totp.Generate returns a base32 secret, so no extra encoding is usually needed here.
	otpURL := fmt.Sprintf("otpauth://totp/%s:%s?secret=%s&issuer=%s",
		url.PathEscape(issuer),   // Issuer name
		url.PathEscape(username), // Account name (e.g., email or username)
		url.QueryEscape(secret),  // The TOTP secret, must be base32 encoded. QueryEscape it for URL safety.
		url.QueryEscape(issuer))  // Issuer name again as a parameter
	Log.Info("Generated TOTP QR Code URL.", zap.String("username", username), zap.String("url", otpURL))
	return otpURL
}

// ValidateTOTP validates the provided TOTP code against the given secret.
// It uses default validation options (e.g., 30s period, 6 digits, SHA1, 1 skew).
// Note: totp.Validate itself does not return an error. Error handling for invalid code formats
// (e.g., non-numeric, wrong length) should ideally be done before calling this if strictness is required,
// though the library may handle some common cases gracefully.
func ValidateTOTP(secret, code string) (bool, error) {
	// Basic validation for code format can be added here if necessary
	// e.g., check length, check if all digits.
	// For now, directly use totp.Validate as per pquerna/otp's typical usage.
	valid := totp.Validate(code, secret)
	if !valid {
		Log.Warn("Invalid TOTP code provided.", zap.String("secret_prefix", secret[:min(len(secret), 5)]), zap.String("code_provided", code))
		// Return a generic error or just false. For consistency with previous structure, returning an error.
		// This error isn't from totp.Validate itself but our application logic.
		return false, errors.New("invalid TOTP code")
	}
	return true, nil
}

// --- Recovery Code Generation and Hashing ---

// GenerateRecoveryCodes generates a specified number of unique recovery codes.
// Each code consists of characters from the charset and has the given length.
// Length should be sufficiently large for security (e.g., 8-12 characters).
func GenerateRecoveryCodes(count int, length int) ([]string, error) {
	if count <= 0 {
		return nil, errors.New("recovery code count must be positive")
	}
	if length <= 0 {
		return nil, errors.New("recovery code length must be positive")
	}

	codes := make([]string, count)
	// Using a common, unambiguous charset for recovery codes.
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Common charset, excludes I, O, 0, 1 for readability
	for i := 0; i < count; i++ {
		codeBytes := make([]byte, length)
		for j := 0; j < length; j++ {
			num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
			if err != nil {
				return nil, fmt.Errorf("failed to generate random char index for recovery code: %w", err)
			}
			codeBytes[j] = charset[num.Int64()]
		}
		codes[i] = string(codeBytes)
	}
	return codes, nil
}

// HashRecoveryCode hashes a recovery code using bcrypt.
func HashRecoveryCode(code string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if err != nil {
		Log.Error("Failed to hash recovery code.", zap.Error(err))
		return "", fmt.Errorf("failed to hash recovery code: %w", err)
	}
	return string(hashedBytes), nil
}

// VerifyRecoveryCode compares a provided recovery code against a stored bcrypt hash.
func VerifyRecoveryCode(hashedCode, providedCode string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedCode), []byte(providedCode))
	if err != nil {
		if !errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			Log.Warn("Error verifying recovery code (not a mismatch).", zap.Error(err))
		}
		return false // Handles mismatch and other errors (e.g., invalid hash format)
	}
	return true
}

// min is a helper function to ensure we don't slice beyond string length
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
