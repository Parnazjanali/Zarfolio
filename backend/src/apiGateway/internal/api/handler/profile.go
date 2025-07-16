package handler

import (
	profilemanager "gold-api/internal/service/profilemanger"

	"github.com/gofiber/fiber/v2"
)

type ProfileHandlerAG struct {
	profileManagerClient *profilemanager.ProfileManagerClient
}

type ProfileHandler struct {
	profileManager profilemanager.ProfileManagerClient
}

func NewProfileHandler(client profilemanager.ProfileManagerClient) *ProfileHandler {
	if client == nil {
		return nil
	}
	return &ProfileHandler{profileManager: client}
}

// Implement methods for ProfileHandler if not already present.
func (ph *ProfileHandler) GetUsers(c *fiber.Ctx) error              { return nil }
func (ph *ProfileHandler) GetUserByID(c *fiber.Ctx) error           { return nil }
func (ph *ProfileHandler) CreateUser(c *fiber.Ctx) error            { return nil }
func (ph *ProfileHandler) UpdateUser(c *fiber.Ctx) error            { return nil }
func (ph *ProfileHandler) DeleteUser(c *fiber.Ctx) error            { return nil }
func (ph *ProfileHandler) HandleUpdateUserRoles(c *fiber.Ctx) error { return nil }
