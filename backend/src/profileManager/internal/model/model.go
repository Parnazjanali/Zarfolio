package model

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/datatypes"
)
<<<<<<< HEAD
type User struct {
    ID              string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
    Username        string         `json:"username" gorm:"unique;not null"`
    PasswordHash    string         `json:"-" gorm:"column:password_hash;not null"`
    Email           string         `json:"email" gorm:"unique;not null"`
    Roles           datatypes.JSON `json:"roles" gorm:"type:jsonb;default:'[\"user\"]';not null"`
    ProfileImageURL string         `json:"profile_image_url,omitempty"`
    CreatedAt       time.Time      `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt       time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
    TwoFASecret     string         `json:"two_fa_secret,omitempty" gorm:"column:two_fa_secret"`
    TwoFAEnabled    bool           `json:"two_fa_enabled" gorm:"column:two_fa_enabled;default:false"`
    ProfilePicture  []byte         `json:"profile_picture,omitempty" gorm:"column:profile_picture;type:bytea"`
}

type UserCreateRequest struct {
    Username string   `json:"username" validate:"required"` 
    Password string   `json:"password" validate:"required"`
    Email    string   `json:"email" validate:"required,email"`
    Roles    []string `json:"roles,omitempty"` 
}

type UserUpdateRequest struct {
    Username    string `json:"username,omitempty"`
    Email       string `json:"email,omitempty" validate:"omitempty,email"`
    NewPassword string `json:"new_password,omitempty"` 
=======

type User struct {
	ID              string         `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Username        string         `json:"username" gorm:"unique;not null"`
	PasswordHash    string         `json:"-" gorm:"column:password_hash;not null"`
	Email           string         `json:"email" gorm:"unique;not null"`
	Roles           datatypes.JSON `json:"roles" gorm:"type:jsonb;default:'[\"user\"]';not null"`
	ProfileImageURL string         `json:"profile_image_url,omitempty"`
	CreatedAt       time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	TwoFASecret     string         `json:"two_fa_secret,omitempty" gorm:"column:two_fa_secret"`
	TwoFAEnabled    bool           `json:"two_fa_enabled" gorm:"column:two_fa_enabled;default:false"`
	ProfilePicture  []byte         `json:"profile_picture,omitempty" gorm:"column:profile_picture;type:bytea"`
}

type UserCreateRequest struct {
	Username string   `json:"username" validate:"required"`
	Password string   `json:"password" validate:"required"`
	Email    string   `json:"email" validate:"required,email"`
	Roles    []string `json:"roles,omitempty"`
}

type UserUpdateRequest struct {
	Username    string `json:"username,omitempty"`
	Email       string `json:"email,omitempty" validate:"omitempty,email"`
	NewPassword string `json:"new_password,omitempty"`
>>>>>>> parnaz-changes
}

type Role struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"unique;not null"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type Permission struct {
	ID          string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"unique;not null"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type RolePermission struct {
	RoleID       string    `json:"role_id" gorm:"primaryKey;type:uuid"`
	PermissionID string    `json:"permission_id" gorm:"primaryKey;type:uuid"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type PasswordResetToken struct {
	ID        string    `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserID    string    `json:"user_id" gorm:"type:uuid;not null"`
	Token     string    `json:"token" gorm:"unique;not null"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

type RegisterRequest struct {
	Username string   `json:"username"`
	Password string   `json:"password"`
	Email    string   `json:"email"`
	Roles    []string `json:"roles"`
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
type CustomClaims struct {
	UserID   string         `json:"user_id"`
	Username string         `json:"username"`
	Roles    datatypes.JSON `json:"roles"`
	jwt.RegisteredClaims
}
<<<<<<< HEAD
=======

type RequestPasswordReset struct {
	Email string `json:"email"`
}
>>>>>>> parnaz-changes
