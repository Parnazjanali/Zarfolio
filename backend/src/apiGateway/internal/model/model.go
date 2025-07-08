package model

import (
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/datatypes"
)

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

type UpdateUserRolesRequest struct {
	Roles []string `json:"roles"`
}
