package model

import (
	"time"
)

type Notification struct {
	ID          uint      `gorm:"primaryKey"`
	SenderID    uint      `gorm:"not null"`
	RecipientID *uint
	IsBroadcast bool      `gorm:"not null;default:false"`
	Message     string    `gorm:"not null"`
	Type        string    `gorm:"not null;type:varchar(50)"`
	Status      string    `gorm:"not null;type:varchar(50);index"`
	ScheduledAt *time.Time `gorm:"index"`
	SentAt      *time.Time
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

type NotificationRead struct {
	ID             uint `gorm:"primaryKey"`
	NotificationID uint `gorm:"not null;uniqueIndex:idx_notification_user"`
	UserID         uint `gorm:"not null;uniqueIndex:idx_notification_user"`
	ReadAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}
