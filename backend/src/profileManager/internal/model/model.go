package model

import "time"

type User struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Username     string    `json:"username" gorm:"unique;not null"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;not null"`
	Email        string    `json:"email" gorm:"unique;not null"`
	Role         string    `json:"role" gorm:"default:'user';not null"`

	// 2FA Fields
	TwoFASecret      string    `json:"-" gorm:"column:two_fa_secret;type:text"`      // Encrypted TOTP secret
	IsTwoFAEnabled   bool      `json:"is_two_fa_enabled" gorm:"column:is_two_fa_enabled;default:false"`
	// Storing recovery codes: Using TEXT and assuming service layer will handle (e.g., JSON array of hashed codes)
    // Alternatively, use datatypes.JSON if your GORM setup supports it well for arrays.
	TwoFARecoveryCodes string `json:"-" gorm:"column:two_fa_recovery_codes;type:text"` // JSON array of HASHED recovery codes

    // Profile Picture Field
    ProfilePictureURL string `json:"profile_picture_url,omitempty" gorm:"column:profile_picture_url;type:text"` // Store URL to the picture

	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
	User    *User  `json:"user,omitempty"`
	Exp     int64  `json:"exp,omitempty"`
}

type ErrorResponse struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
	Details string `json:"details,omitempty"`
}

// PasswordResetToken defines the structure for password reset tokens.
type PasswordResetToken struct {
	ID        string    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Token     string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"-"` // Token itself is not usually sent in JSON response
	UserID    string    `gorm:"type:uuid;not null" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"` // Foreign key relationship
	Email     string    `gorm:"type:varchar(255);not null" json:"email"` // Store email for auditing/verification
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}

// RequestPasswordResetRequest defines the structure for a password reset request.
type RequestPasswordResetRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordRequest defines the structure for resetting a password with a token.
type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"` // Add password complexity validation if desired
}

// ChangeUsernameRequest defines the structure for changing a username.
type ChangeUsernameRequest struct {
	NewUsername     string `json:"new_username" validate:"required,alphanum,min=3,max=30"`
	CurrentPassword string `json:"current_password" validate:"required"`
}

// ChangePasswordRequest defines the structure for changing a password.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"` // Add password complexity validation if desired
}

// GenerateTwoFAResponse defines the data returned when generating a 2FA secret.
type GenerateTwoFAResponse struct {
	Secret    string `json:"secret"`     // The raw TOTP secret (to be shown to user for manual entry)
	QRCodeURL string `json:"qr_code_url"` // The otpauth:// URL for QR code generation
}

// VerifyTwoFARequest defines the request body for verifying a TOTP code during 2FA setup.
type VerifyTwoFARequest struct {
	TOTPCode string `json:"totp_code" validate:"required,numeric,length=6"`
}

// EnableTwoFAResponse defines the data returned upon successful 2FA enablement.
type EnableTwoFAResponse struct {
	RecoveryCodes []string `json:"recovery_codes"` // Plaintext recovery codes (show ONCE)
}

// DisableTwoFARequest defines the request body for disabling 2FA.
type DisableTwoFARequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
}

// LoginStep1Response is returned when 2FA is required after password validation.
type LoginStep1Response struct {
	TwoFARequired bool   `json:"two_fa_required"`
	UserID        string `json:"user_id,omitempty"` // Sent if 2FA is required, for client to use in next step
	Message       string `json:"message"`
	// Alternatively, an interim_token could be sent instead of user_id.
	// InterimToken  string `json:"interim_token,omitempty"`
}

// LoginTwoFARequest defines the request body for submitting the TOTP code.
type LoginTwoFARequest struct {
	UserID   string `json:"user_id" validate:"required"` // Or InterimToken
	TOTPCode string `json:"totp_code" validate:"required,numeric,length=6"`
}
