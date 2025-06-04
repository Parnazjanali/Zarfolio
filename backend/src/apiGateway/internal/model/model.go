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
	Id           string `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}
type AuthResponse struct {
	Message string `json:"message"` 
	Token   string `json:"token"`   
	User    *User  `json:"user"`    
	Exp     int64  `json:"exp"`
}

// RequestPasswordResetRequest defines the structure for a password reset request via API Gateway.
type RequestPasswordResetRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordRequest defines the structure for resetting a password with a token via API Gateway.
type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

// ChangeUsernameRequest defines the structure for changing a username via API Gateway.
type ChangeUsernameRequest struct {
	NewUsername     string `json:"new_username" validate:"required,alphanum,min=3,max=30"`
	CurrentPassword string `json:"current_password" validate:"required"`
}

// ChangePasswordRequest defines the structure for changing a password via API Gateway.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}
