package model

import "time"

type User struct {
	ID           string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Username     string    `json:"username" gorm:"unique;not null"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;not null"`
	Email        string    `json:"email" gorm:"unique;not null"`
	Role         string    `json:"role" gorm:"default:'user';not null"`
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
