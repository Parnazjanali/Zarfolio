package repository

import (
	"notificationManager/internal/model"
	"time"

	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(notification *model.Notification) error
	GetUserNotifications(userID uint) ([]model.Notification, error)
	MarkAsRead(notificationID, userID uint) error
	GetAll() ([]model.Notification, error)
	GetByID(id uint) (*model.Notification, error)
	GetReadStatus(notificationID uint) ([]model.NotificationRead, error)
	GetScheduledNotifications() ([]model.Notification, error)
	UpdateNotification(notification *model.Notification) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(notification *model.Notification) error {
	return r.db.Create(notification).Error
}

func (r *notificationRepository) GetUserNotifications(userID uint) ([]model.Notification, error) {
	var notifications []model.Notification
	err := r.db.Where("recipient_id = ? OR is_broadcast = ?", userID, true).Find(&notifications).Error
	return notifications, err
}

func (r *notificationRepository) MarkAsRead(notificationID, userID uint) error {
	read := model.NotificationRead{
		NotificationID: notificationID,
		UserID:         userID,
	}
	return r.db.FirstOrCreate(&read).Error
}

func (r *notificationRepository) GetAll() ([]model.Notification, error) {
	var notifications []model.Notification
	err := r.db.Find(&notifications).Error
	return notifications, err
}

func (r *notificationRepository) GetByID(id uint) (*model.Notification, error) {
	var notification model.Notification
	err := r.db.First(&notification, id).Error
	return &notification, err
}

func (r *notificationRepository) GetReadStatus(notificationID uint) ([]model.NotificationRead, error) {
	var reads []model.NotificationRead
	err := r.db.Where("notification_id = ?", notificationID).Find(&reads).Error
	return reads, err
}

func (r *notificationRepository) GetScheduledNotifications() ([]model.Notification, error) {
	var notifications []model.Notification
	err := r.db.Where("status = ? AND scheduled_at <= ?", "SCHEDULED", time.Now()).Find(&notifications).Error
	return notifications, err
}

func (r *notificationRepository) UpdateNotification(notification *model.Notification) error {
	return r.db.Save(notification).Error
}