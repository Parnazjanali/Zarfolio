package account

type AccountService interface{
	changeUsername(userID string, newUsername string) error
	changePassword(userID string, oldPassword string, newPassword string) error
	uploadProfilePicture(userID string, pictureData []byte) error
	generateTwoFASetup(userID string) (string, error)
	verifyAndEnableTwoFA(userID string, code string) error
	disableTwoFA(userID string) error

	
}
