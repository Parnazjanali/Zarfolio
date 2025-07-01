// settings-manager/internal/model/settings.go

package model

// BusinessInfo struct defines the data model for business information.
// It includes fields for store details that will be stored and retrieved.
type BusinessInfo struct {
	ID           int    `json:"id"`
	StoreName    string `json:"storeName" validate:"required,min=2,max=100"`
	Address      string `json:"address" validate:"max=255"`
	PhoneNumber  string `json:"phoneNumber" validate:"max=20"`
	EconomicCode string `json:"economicCode" validate:"max=50"`
	LogoURL      string `json:"logoUrl" validate:"omitempty,url"`
}