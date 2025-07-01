package profilemanager

import "gold-api/internal/model" // مدل‌ها از پکیج مدل اصلی وارد می‌شوند

type ProfileManagerClient interface {
	// --- Authentication & Core User Operations ---
	RegisterUser(req model.RegisterRequest) error
	AuthenticateUser(username, password string) (*model.User, string, *model.CustomClaims, error)
	LogoutUser(token string) error
	RequestPasswordReset(email string) error                                                 // از AuthHandler.HandleRequestPasswordReset
	ResetPassword(token, newPassword string) error                                           // از AuthHandler.HandleResetPassword
	VerifyTwoFACode(username, code string) (*model.User, string, *model.CustomClaims, error) // از AuthHandler.HandleLoginTwoFA (نام متد منطقی‌تر)

	// --- Account Management Operations ---
	// این متدها معمولاً نیاز به `userID` یا `username` برای شناسایی کاربر در سمت ProfileManager دارند
	// فرض می‌کنیم این اطلاعات از توکن JWT کاربر احراز هویت شده گرفته شده و به این متدها ارسال می‌شوند.
	ChangeUsername(userID string, req model.ChangeUsernameRequest) error
	ChangePassword(userID string, req model.ChangePasswordRequest) error
	// برای آپلود فایل، نوع `fileContent` می‌تواند `[]byte` یا `io.Reader` باشد
	// در API Gateway شما فایل را به عنوان `multipart.File` دریافت می‌کنید، سپس آن را می‌خوانید و به صورت `[]byte` یا stream به ProfileManager ارسال می‌کنید.
	UploadProfilePicture(userID string, filename string, contentType string, fileContent []byte) error // مثال دقیق‌تر برای آپلود فایل
	GenerateTwoFASetup(userID string) (secret string, qrCode string, err error)                        // Returns secret and QR code URL
	VerifyAndEnableTwoFA(userID string, req model.VerifyTwoFARequest) error
	DisableTwoFA(userID string, req model.DisableTwoFARequest) error

	// --- User Management Operations (Admin/Owner) ---
	GetUsers() ([]model.User, error)
	GetUserByID(userID string) (*model.User, error)
	CreateUser(req model.RegisterRequest) (*model.User, error) // CreateUser by admin, might return User struct
	UpdateUser(userID string, req model.User) error            // Assuming model.User is used for update body
	DeleteUser(userID string) error                            // Soft delete
	UpdateUserRoles(userID string, roles []string) error       // You already had this

	// --- Utility Method ---
	BaseURL() string // این برای هندلرها برای ساخت URL پراکسی ضروری است.
}
