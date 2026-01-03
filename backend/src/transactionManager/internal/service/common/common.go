package common

import "errors"

const (
	ServiceName      = "transaction"
	OperationCreate  = "CreateGenericTransaction"
	ErrorInvalidBody = "Invalid request body"
	ErrorService     = "Failed to create generic transaction"
	ErrorConflict    = "Service error: %s"
	SuccessMessage   = "Generic transaction created successfully"
)

var (
	ErrCrmManagerDown    = errors.New("CRM manager service is unavailable")
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user with this username or email already exists")
	ErrInternalService   = errors.New("internal service error")
)
