package postgresDb

import (
	"errors"
	"fmt"
	"profile-gold/internal/model"
	"profile-gold/internal/utils"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	ErrPasswordResetTokenNotFound = errors.New("password reset token not found")
	ErrPasswordResetTokenExpired  = errors.New("password reset token has expired")
)

type PasswordResetTokenRepository interface {
	CreateToken(token *model.PasswordResetToken) error
	GetToken(tokenString string) (*model.PasswordResetToken, error)
	DeleteToken(tokenString string) error
	DeleteTokensByUserID(userID string) error // Optional: useful for cleanup
}

type postgresPasswordResetTokenRepository struct {
	db *gorm.DB
}

func NewPostgresPasswordResetTokenRepository(db *gorm.DB) PasswordResetTokenRepository {
	if db == nil {
		utils.Log.Fatal("GORM DB instance is nil for NewPostgresPasswordResetTokenRepository.")
	}
	// Auto-migrate the PasswordResetToken table
	err := db.AutoMigrate(&model.PasswordResetToken{})
	if err != nil {
		utils.Log.Fatal("Failed to auto migrate PasswordResetToken table", zap.Error(err))
	}
	utils.Log.Info("PasswordResetToken table auto-migrated successfully.")
	return &postgresPasswordResetTokenRepository{db: db}
}

func (r *postgresPasswordResetTokenRepository) CreateToken(prToken *model.PasswordResetToken) error {
	prToken.CreatedAt = time.Now()
	result := r.db.Create(prToken)
	if result.Error != nil {
		return fmt.Errorf("failed to create password reset token in DB: %w", result.Error)
	}
	utils.Log.Info("Password reset token created in PostgreSQL", zap.String("email", prToken.Email), zap.String("userID", prToken.UserID))
	return nil
}

func (r *postgresPasswordResetTokenRepository) GetToken(tokenString string) (*model.PasswordResetToken, error) {
	var prToken model.PasswordResetToken
	// It's good practice to also join with User if you need user details, but not strictly necessary for token validation itself.
	// result := r.db.Preload("User").Where("token = ?", tokenString).First(&prToken)
	result := r.db.Where("token = ?", tokenString).First(&prToken)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrPasswordResetTokenNotFound
		}
		return nil, fmt.Errorf("failed to get password reset token from DB: %w", result.Error)
	}

	if time.Now().After(prToken.ExpiresAt) {
		// Optional: Delete expired token here to clean up, or have a separate cleanup job
		// if errDel := r.DeleteToken(tokenString); errDel != nil {
		//	 utils.Log.Error("Failed to delete expired token during GetToken", zap.String("token", tokenString), zap.Error(errDel))
		// }
		return &prToken, ErrPasswordResetTokenExpired // Return the token along with the expired error, so service layer can decide to delete.
	}

	utils.Log.Info("Password reset token found in PostgreSQL", zap.String("token", tokenString))
	return &prToken, nil
}

func (r *postgresPasswordResetTokenRepository) DeleteToken(tokenString string) error {
	result := r.db.Where("token = ?", tokenString).Delete(&model.PasswordResetToken{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete password reset token from DB: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		// This might not be an error if the token was already deleted or never existed.
		// Depending on logic, you might return ErrPasswordResetTokenNotFound or just log it.
		utils.Log.Warn("Attempted to delete a password reset token that was not found or already deleted.", zap.String("token", tokenString))
		return ErrPasswordResetTokenNotFound // Be consistent: if GetToken returns this, DeleteToken should too if it doesn't find it.
	}
	utils.Log.Info("Password reset token deleted from PostgreSQL", zap.String("token", tokenString))
	return nil
}

func (r *postgresPasswordResetTokenRepository) DeleteTokensByUserID(userID string) error {
	result := r.db.Where("user_id = ?", userID).Delete(&model.PasswordResetToken{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete password reset tokens by user ID from DB: %w", result.Error)
	}
	utils.Log.Info("Password reset tokens deleted for user ID", zap.String("userID", userID), zap.Int64("rows_affected", result.RowsAffected))
	return nil
}
