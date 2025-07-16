package model

import (
	"time"

	"gorm.io/datatypes"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

type User struct {
	ID           string         `json:"id" gorm:"primaryKey;type:uuid"`
	Username     string         `json:"username"`
	PasswordHash string         `json:"-"`
	Email        string         `json:"email"`
	Roles        datatypes.JSON `json:"roles" gorm:"type:jsonb"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

type AuthResponse struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
	User    *User  `json:"user,omitempty"`
	Exp     int64  `json:"exp,omitempty"`
}
type VerifyTwoFARequest struct {
	Code string `json:"code"` // The 2FA code provided by the user
	// You might also need a session ID or temporary token here if it's a multi-step process
}

// NEW: Request for disabling 2FA (might require password for security)
type DisableTwoFARequest struct {
	Password string `json:"password"` // User's password to confirm disabling 2FA
	Code     string `json:"code"`     // Current 2FA code to confirm
}

// NEW: Request for changing username
type ChangeUsernameRequest struct {
	NewUsername string `json:"new_username"`
	Password    string `json:"password"` // Current password for re-authentication
}

// NEW: Request for changing password
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}
type RequestPasswordReset struct {
	Email string `json:"email"`
}
type ResetPasswordRequest struct {
	Token string `json:"reset_token"` // Token sent to the user's email
	NewPassword string `json:"new_password"` // New password to set
}
