package service

import "errors"

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserAlreadyExists  = errors.New("user with this username or email already exists")
	ErrInternalService    = errors.New("internal service error")
	ErrProfileManagerDown = errors.New("profile manager service is unavailable")
	ErrCrmManagerDown    = errors.New("CRM manager service is unavailable")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrInvalidTwoFACode   = errors.New("invalid two-factor authentication code")
	ErrCustomerNotFound   = errors.New("customer not found")
)
