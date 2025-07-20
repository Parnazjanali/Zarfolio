package profilemanager

import "gold-api/internal/model" 

type ProfileManagerClient interface {

	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(username, password string) (*model.User, string, *model.CustomClaims, error)
	LogoutUser(token string) error
	RequestPasswordReset(email string) error                                               
	ResetPassword(token, newPassword string) error                                          
	VerifyTwoFACode(username, code string) (*model.User, string, *model.CustomClaims, error) 

	ChangeUsername(userID string, req model.ChangeUsernameRequest) error
	ChangePassword(userID string, req model.ChangePasswordRequest) error
	UploadProfilePicture(userID string, filename string, contentType string, fileContent []byte) error 
	GenerateTwoFASetup(userID string) (secret string, qrCode string, err error)                       
	VerifyAndEnableTwoFA(userID string, req model.VerifyTwoFARequest) error
	DisableTwoFA(userID string, req model.DisableTwoFARequest) error

	GetUsers() ([]model.User, error)
	GetUserByID(userID string) (*model.User, error)
	CreateUser(req model.RegisterRequest) (*model.User, error) 
	UpdateUser(userID string, req model.User) error           
	DeleteUser(userID string) error                            
	UpdateUserRoles(userID string, roles []string) error       

	// --- Utility Method ---
	BaseURL() string 
}
