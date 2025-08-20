package api

import (
	"notificationManager/internal/service"
	pb "notificationManager/proto"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

// HTTPHandler holds the notification service.
type HTTPHandler struct {
	service service.NotificationService
}

// NewHTTPHandler creates a new HTTP handler.
func NewHTTPHandler(s service.NotificationService) *HTTPHandler {
	return &HTTPHandler{service: s}
}

// CreateNotification handles the creation of a new notification.
func (h *HTTPHandler) CreateNotification(c *fiber.Ctx) error {
	req := new(pb.CreateNotificationRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse request"})
	}

	var userID *uint
	if req.UserId != 0 {
		u := uint(req.UserId)
		userID = &u
	}

	var scheduledAt *time.Time
	if req.ScheduledAt != nil {
		t := req.ScheduledAt.AsTime()
		scheduledAt = &t
	}

	notification, err := h.service.CreateNotification(req.Message, req.Type, req.RecipientType, userID, scheduledAt)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(notification)
}

// GetUserNotifications handles fetching notifications for a specific user.
func (h *HTTPHandler) GetUserNotifications(c *fiber.Ctx) error {
	userID, err := strconv.ParseUint(c.Params("user_id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid user ID"})
	}

	notifications, err := h.service.GetUserNotifications(uint(userID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(notifications)
}

// MarkNotificationAsRead handles marking a notification as read.
func (h *HTTPHandler) MarkNotificationAsRead(c *fiber.Ctx) error {
	req := new(pb.MarkNotificationAsReadRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse request"})
	}

	if err := h.service.MarkNotificationAsRead(uint(req.NotificationId), uint(req.UserId)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"status": "ok"})
}

// GetAllNotifications handles fetching all notifications.
func (h *HTTPHandler) GetAllNotifications(c *fiber.Ctx) error {
	notifications, err := h.service.GetAllNotifications()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(notifications)
}

// GetNotificationReadStatus handles fetching the read status for a notification.
func (h *HTTPHandler) GetNotificationReadStatus(c *fiber.Ctx) error {
	notificationID, err := strconv.ParseUint(c.Params("notification_id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid notification ID"})
	}

	readStatus, err := h.service.GetNotificationReadStatus(uint(notificationID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(readStatus)
}
