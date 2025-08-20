package commonService

import "errors"

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrNotFound       = errors.New("record not found")
	ErrAlreadyExists  = errors.New("record already exists")
	ErrInternalService    = errors.New("internal service error")
	ErrCrmManagerDown = errors.New("Crm manager service is unavailable")
	ErrInvalidToken       = errors.New("invalid or expired token")

)
