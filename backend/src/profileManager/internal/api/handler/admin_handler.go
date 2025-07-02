package handler

import (
	"errors"
	"profile-gold/internal/model"
	"profile-gold/internal/service"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AdminHandler struct {
	userService service.UserService
	logger      *zap.Logger
}

func NewAdminHandler(us service.UserService) *AdminHandler {
	return &AdminHandler{
		userService: us,
		logger:      utils.Log.With(zap.String("handler", "AdminHandler")), // Add component-specific logging
	}
}

// HandleListUsers godoc
// @Summary List all users
// @Description Retrieves a list of all users with their details.
// @Tags Admin
// @Accept json
// @Produce json
// @Success 200 {array} model.User "Successfully retrieved list of users"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/admin/users [get]
// @Security BearerAuth
func (h *AdminHandler) HandleListUsers(c *fiber.Ctx) error {
	// TODO: Add authorization check to ensure only admins can access this.
	// For now, assuming authorization is handled by middleware or will be added.
	// Example:
	// claims := c.Locals("user").(*utils.CustomClaims)
	// if claims.Role != model.AdminRole && claims.Role != model.SuperAdminRole {
	//    h.logger.Warn("HandleListUsers: Non-admin user attempted to list users", zap.String("userID", claims.UserID), zap.String("role", string(claims.Role)))
	// 	  return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{Message: "Forbidden: Insufficient privileges"})
	// }


	users, err := h.userService.ListUsers()
	if err != nil {
		h.logger.Error("HandleListUsers: Failed to list users", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to retrieve users"})
	}

	h.logger.Info("HandleListUsers: Successfully retrieved users list", zap.Int("count", len(users)))
	return c.Status(fiber.StatusOK).JSON(users)
}

type UpdateUserRoleRequest struct {
	Role model.Role `json:"role" validate:"required"`
}

// HandleUpdateUserRole godoc
// @Summary Update a user's role
// @Description Updates the role of a specific user.
// @Tags Admin
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param role_update body UpdateUserRoleRequest true "Role update information"
// @Success 200 {object} model.User "Successfully updated user's role"
// @Failure 400 {object} model.ErrorResponse "Invalid request payload or user ID"
// @Failure 403 {object} model.ErrorResponse "Forbidden: Insufficient privileges"
// @Failure 404 {object} model.ErrorResponse "User not found"
// @Failure 500 {object} model.ErrorResponse "Internal server error"
// @Router /api/v1/admin/users/{userId}/role [put]
// @Security BearerAuth
func (h *AdminHandler) HandleUpdateUserRole(c *fiber.Ctx) error {
	// TODO: Add authorization check
	// claims := c.Locals("user").(*utils.CustomClaims)
	// if claims.Role != model.AdminRole && claims.Role != model.SuperAdminRole {
	//    h.logger.Warn("HandleUpdateUserRole: Non-admin user attempted to update role", zap.String("userID", claims.UserID), zap.String("role", string(claims.Role)))
	// 	  return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{Message: "Forbidden: Insufficient privileges"})
	// }

	userID := c.Params("userId")
	if userID == "" {
		h.logger.Warn("HandleUpdateUserRole: User ID not provided in path")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "User ID is required"})
	}

	var req UpdateUserRoleRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Warn("HandleUpdateUserRole: Failed to parse request body", zap.String("userID", userID), zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request payload", Details: err.Error()})
	}

	// Validate the role
	switch req.Role {
	case model.SuperAdmin, model.Admin, model.Accountant, model.Seller:
		// Valid role
	default:
		h.logger.Warn("HandleUpdateUserRole: Invalid role provided", zap.String("userID", userID), zap.String("role", string(req.Role)))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid role specified"})
	}

	updatedUser, err := h.userService.UpdateUserRole(userID, req.Role)
	if err != nil {
		h.logger.Error("HandleUpdateUserRole: Failed to update user role", zap.String("userID", userID), zap.String("newRole", string(req.Role)), zap.Error(err))
		if errors.Is(err, service.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "User not found"})
		}
		// Add more specific error handling if needed
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to update user role"})
	}

	h.logger.Info("HandleUpdateUserRole: Successfully updated user role", zap.String("userID", userID), zap.String("newRole", string(req.Role)))
	return c.Status(fiber.StatusOK).JSON(updatedUser)
}
