package service

import (
	"notificationManager/internal/model"
	"notificationManager/internal/repository"
	"time"
)

type NotificationService interface {
	CreateNotification(message, notificationType, recipientType string, userID *uint, scheduledAt *time.Time) (*model.Notification, error)
	GetUserNotifications(userID uint) ([]model.Notification, error)
	MarkNotificationAsRead(notificationID, userID uint) error
	GetAllNotifications() ([]model.Notification, error)
	GetNotificationReadStatus(notificationID uint) ([]model.NotificationRead, error)
	SendScheduledNotifications() error
}

type notificationService struct {
	repo repository.NotificationRepository
}

func NewNotificationService(repo repository.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) CreateNotification(message, notificationType, recipientType string, userID *uint, scheduledAt *time.Time) (*model.Notification, error) {
	notification := &model.Notification{
		Message:     message,
		Type:        notificationType,
		ScheduledAt: scheduledAt,
	}

	if recipientType == "ALL" {
		notification.IsBroadcast = true
	} else {
		notification.RecipientID = userID
	}

	if scheduledAt != nil {
		notification.Status = "SCHEDULED"
	} else {
		notification.Status = "SENT"
		notification.SentAt = new(time.Time)
		*notification.SentAt = time.Now()
	}

	err := s.repo.Create(notification)
	return notification, err
}

func (s *notificationService) GetUserNotifications(userID uint) ([]model.Notification, error) {
	return s.repo.GetUserNotifications(userID)
}

func (s *notificationService) MarkNotificationAsRead(notificationID, userID uint) error {
	return s.repo.MarkAsRead(notificationID, userID)
}

func (s *notificationService) GetAllNotifications() ([]model.Notification, error) {
	return s.repo.GetAll()
}

func (s *notificationService) GetNotificationReadStatus(notificationID uint) ([]model.NotificationRead, error) {
	return s.repo.GetReadStatus(notificationID)
}

func (s *notificationService) SendScheduledNotifications() error {
	notifications, err := s.repo.GetScheduledNotifications()
	if err != nil {
		return err
	}

	for _, notification := range notifications {
		notification.Status = "SENT"
		notification.SentAt = new(time.Time)
		*notification.SentAt = time.Now()
		s.repo.UpdateNotification(&notification)
	}

	return nil
}