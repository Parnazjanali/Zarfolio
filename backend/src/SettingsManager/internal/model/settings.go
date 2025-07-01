// backend/src/SettingsManager/internal/model/settings.go
package model

import "time"

// SystemSettings تمام تنظیمات سیستمی را در خود جای می‌دهد.
type SystemSettings struct {
	ID        uint      `json:"id" gorm:"primarykey"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// اطلاعات پایه
	StoreName    string `json:"store_name" gorm:"size:100"`
	EconomicCode string `json:"economic_code" gorm:"size:50"`
	PhoneNumber  string `json:"phone_number" gorm:"size:50"`
	LogoURL      string `json:"logo_url" gorm:"size:255"`
	FullAddress  string `json:"full_address" gorm:"size:500"`

	// مالی و تخصصی
	BaseCurrency          string  `json:"base_currency" gorm:"size:10;default:'ریال'"`
	DefaultVatPercentage  float64 `json:"default_vat_percentage" gorm:"type:decimal(5,2);default:9.0"`
	DefaultWagePercentage float64 `json:"default_wage_percentage" gorm:"type:decimal(5,2);default:7.0"`
	GoldApiKey            string  `json:"gold_api_key" gorm:"size:255"`

	// تنظیمات چاپ
	InvoiceHeader string `json:"invoice_header" gorm:"type:text"`
	InvoiceFooter string `json:"invoice_footer" gorm:"type:text"`

	// اعلان‌ها
	EnableEmailNotifications bool `json:"enable_email_notifications" gorm:"default:false"`
	SendDailySummaryEmail    bool `json:"send_daily_summary_email" gorm:"default:false"`
}