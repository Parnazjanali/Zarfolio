package user

type NewUserService interface {
	GetUsers() ([]User, error)
	GetUserByID(id string) (*User, error)
	CreateUser(user User) error
	UpdateUser(id string, user User) error
	DeleteUser(id string) error
	HandleUpdateUserRoles(userID string, roles []string) error
}
