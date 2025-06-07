package model

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ErrorResponse struct {
	Message string `json:"message"`
	Code    string `json:"code"`
}

type User struct {
	Id                string `json:"id"`
	Username          string `json:"username"`
	PasswordHash      string `json:"-"`
	Email             string `json:"email"`
	Role              string `json:"role"`
	CreatedAt         string `json:"created_at"`
	UpdatedAt         string `json:"updated_at"`
	IsTwoFAEnabled    bool   `json:"is_two_fa_enabled"`
	ProfilePictureURL string `json:"profile_picture_url"`
}
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}
type AuthResponse struct {
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
	User    *User  `json:"user,omitempty"`
	Exp     int64  `json:"exp,omitempty"`
}

type RequestPasswordResetRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

type ChangeUsernameRequest struct {
	NewUsername     string `json:"new_username" validate:"required,alphanum,min=3,max=30"`
	CurrentPassword string `json:"current_password" validate:"required"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

type LoginStep1ResponseAG struct {
	TwoFARequired bool   `json:"two_fa_required"`
	UserID        string `json:"user_id,omitempty"`
	Message       string `json:"message"`
}

type LoginTwoFARequestAG struct {
	UserID   string `json:"user_id" validate:"required"`
	TOTPCode string `json:"totp_code" validate:"required,numeric,length=6"`
}

type GenerateTwoFAResponseAG struct {
	Secret    string `json:"secret"`
	QRCodeURL string `json:"qr_code_url"`
}

type VerifyTwoFARequestAG struct {
	TOTPCode string `json:"totp_code" validate:"required,numeric,length=6"`
}

type EnableTwoFAResponseAG struct {
	RecoveryCodes []string `json:"recovery_codes"`
}

type DisableTwoFARequestAG struct {
    // اصلاح شد: تگ از "password" به "current_password" تغییر کرد
	Password string `json:"current_password" validate:"required"`
}