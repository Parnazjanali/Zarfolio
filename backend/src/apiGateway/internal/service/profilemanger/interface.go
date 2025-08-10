package profilemanager

import "gold-api/internal/model" 

type ProfileManagerClient interface {

	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(username, password string) (*model.User, string, *model.CustomClaims, error)
	LogoutUser(token string) error
	RequestPasswordReset(email string) error                                               
	ResetPassword(token, newPassword string) error                                          
	VerifyTwoFACode(username, code string) (*model.User, string, *model.CustomClaims, error) 

	
	// --- Utility Method ---
	BaseURL() string 
}
