package handler

import (
	"errors"
	"profile-gold/internal/model"
	"profile-gold/internal/service"
	"profile-gold/internal/utils" // For logging

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// CounterpartyHandler handles API requests related to counterparties.
type CounterpartyHandler struct {
	service service.CounterpartyService
	logger  *zap.Logger
}

// NewCounterpartyHandler creates a new CounterpartyHandler.
func NewCounterpartyHandler(s service.CounterpartyService, logger *zap.Logger) *CounterpartyHandler {
	if s == nil {
		panic("CounterpartyService cannot be nil for CounterpartyHandler")
	}
	if logger == nil {
		if utils.Log == nil { // Fallback to global logger
			panic("Logger is nil and utils.Log is not initialized for CounterpartyHandler")
		}
		logger = utils.Log
	}
	return &CounterpartyHandler{service: s, logger: logger}
}

// CreateCounterparty handles POST requests to create a new counterparty.
func (h *CounterpartyHandler) CreateCounterparty(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Warn("CreateCounterparty: UserID not found in context")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found."})
	}

	var req model.Counterparty
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("CreateCounterparty: Failed to parse request body", zap.Error(err), zap.String("userID", userID))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request body."})
	}

	// ID and UserID should not be set by client in create request for model.Counterparty
	// UserID will be set by service from token, ID auto-generated by DB
	req.ID = "" // Ensure client cannot set primary key
	req.UserID = "" // Will be set by service from authenticated user

	createdCounterparty, err := h.service.CreateCounterparty(&req, userID)
	if err != nil {
		h.logger.Error("CreateCounterparty: Service error", zap.Error(err), zap.String("userID", userID))
		if errors.Is(err, service.ErrCounterpartyValidation) || errors.Is(err, service.ErrInvalidNationalIDFormat) {
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: err.Error()})
		}
		if errors.Is(err, service.ErrNationalIDExists) || errors.Is(err, service.ErrAccountCodeExists) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: err.Error()})
		}
		if errors.Is(err, service.ErrCreateCounterpartyFailed) { // Generic service failure
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to create counterparty."})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "An unexpected error occurred."})
	}

	h.logger.Info("CreateCounterparty: Success", zap.String("userID", userID), zap.String("counterpartyID", createdCounterparty.ID))
	return c.Status(fiber.StatusCreated).JSON(createdCounterparty)
}

// GetCounterparty handles GET requests to retrieve a single counterparty by ID.
func (h *CounterpartyHandler) GetCounterparty(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Warn("GetCounterparty: UserID not found in context")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found."})
	}

	counterpartyID := c.Params("id")
	if counterpartyID == "" {
		h.logger.Warn("GetCounterparty: Missing counterparty ID in params", zap.String("userID", userID))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Counterparty ID is required."})
	}

	cp, err := h.service.GetCounterpartyByID(counterpartyID, userID)
	if err != nil {
		h.logger.Warn("GetCounterparty: Service error", zap.Error(err), zap.String("userID", userID), zap.String("counterpartyID", counterpartyID))
		if errors.Is(err, service.ErrCounterpartyNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "Counterparty not found or not accessible."})
		}
		if errors.Is(err, service.ErrGetCounterpartyFailed) { // Generic service failure
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to retrieve counterparty."})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "An unexpected error occurred."})
	}

	h.logger.Debug("GetCounterparty: Success", zap.String("userID", userID), zap.String("counterpartyID", cp.ID))
	return c.Status(fiber.StatusOK).JSON(cp)
}

// ListCounterparties handles GET requests to list all counterparties for the authenticated user.
func (h *CounterpartyHandler) ListCounterparties(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Warn("ListCounterparties: UserID not found in context")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found."})
	}

	counterparties, err := h.service.ListCounterpartiesByUserID(userID)
	if err != nil {
		h.logger.Error("ListCounterparties: Service error", zap.Error(err), zap.String("userID", userID))
		// service.ErrListCounterpartiesFailed is a generic error
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to list counterparties."})
	}

	h.logger.Debug("ListCounterparties: Success", zap.String("userID", userID), zap.Int("count", len(counterparties)))
	return c.Status(fiber.StatusOK).JSON(counterparties)
}

// UpdateCounterparty handles PUT requests to update an existing counterparty.
func (h *CounterpartyHandler) UpdateCounterparty(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Warn("UpdateCounterparty: UserID not found in context")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found."})
	}

	counterpartyID := c.Params("id")
	if counterpartyID == "" {
		h.logger.Warn("UpdateCounterparty: Missing counterparty ID in params", zap.String("userID", userID))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Counterparty ID is required."})
	}

	var req model.Counterparty // Using model.Counterparty directly for update, service layer handles partial update logic.
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("UpdateCounterparty: Failed to parse request body", zap.Error(err), zap.String("userID", userID), zap.String("counterpartyID", counterpartyID))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request body."})
	}

	// Ensure client cannot change immutable fields via this request model if Counterparty model is used directly
	// ID is from URL param. UserID is from token.
	// req.ID = counterpartyID // Service will use ID from param
	// req.UserID = userID // Service will use UserID from param

	updatedCounterparty, err := h.service.UpdateCounterparty(counterpartyID, userID, &req)
	if err != nil {
		h.logger.Error("UpdateCounterparty: Service error", zap.Error(err), zap.String("userID", userID), zap.String("counterpartyID", counterpartyID))
		if errors.Is(err, service.ErrCounterpartyNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "Counterparty not found or not accessible."})
		}
		if errors.Is(err, service.ErrCounterpartyValidation) || errors.Is(err, service.ErrInvalidNationalIDFormat) {
			return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: err.Error()})
		}
		if errors.Is(err, service.ErrNationalIDExists) || errors.Is(err, service.ErrAccountCodeExists) {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: err.Error()})
		}
		if errors.Is(err, service.ErrUpdateCounterpartyFailed) { // Generic service failure
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to update counterparty."})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "An unexpected error occurred."})
	}

	h.logger.Info("UpdateCounterparty: Success", zap.String("userID", userID), zap.String("counterpartyID", updatedCounterparty.ID))
	return c.Status(fiber.StatusOK).JSON(updatedCounterparty)
}

// DeleteCounterparty handles DELETE requests to remove a counterparty.
func (h *CounterpartyHandler) DeleteCounterparty(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Warn("DeleteCounterparty: UserID not found in context")
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User ID not found."})
	}

	counterpartyID := c.Params("id")
	if counterpartyID == "" {
		h.logger.Warn("DeleteCounterparty: Missing counterparty ID in params", zap.String("userID", userID))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Counterparty ID is required."})
	}

	err := h.service.DeleteCounterparty(counterpartyID, userID)
	if err != nil {
		h.logger.Error("DeleteCounterparty: Service error", zap.Error(err), zap.String("userID", userID), zap.String("counterpartyID", counterpartyID))
		if errors.Is(err, service.ErrCounterpartyNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "Counterparty not found or not accessible."})
		}
		if errors.Is(err, service.ErrDeleteCounterpartyFailed) { // Generic service failure
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to delete counterparty."})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "An unexpected error occurred."})
	}

	h.logger.Info("DeleteCounterparty: Success", zap.String("userID", userID), zap.String("counterpartyID", counterpartyID))
	return c.Status(fiber.StatusNoContent).JSON(nil) // Or fiber.Map{"message": "Counterparty deleted successfully"}
}
