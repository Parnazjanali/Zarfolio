package handler

import (
	profilemanager "gold-api/internal/service/profilemanger"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type AccountHandlerAG struct {
	profileManagerClient profilemanager.ProfileManagerClient
}

func NewAccountHandlerAG(client profilemanager.ProfileManagerClient) *AccountHandlerAG {
	if client == nil {
		utils.Log.Fatal("ProfileManagerClient cannot be nil in NewAccountHandlerAG")
		return nil
	}
	return &AccountHandlerAG{
		profileManagerClient: client,
	}
}
func (h *AccountHandlerAG) HandleChangePassword(c *fiber.Ctx) error {
	// Implementation for changing password
	return nil
}
func (h *AccountHandlerAG) HandleChangeUsername(c *fiber.Ctx) error {
	// Implementation for changing username
	return nil
}
func (h *AccountHandlerAG) HandleProfilePictureUpload(c *fiber.Ctx) error {
	// Implementation for uploading profile picture
	return nil
}
func (h *AccountHandlerAG) HandleGenerateTwoFASetup(c *fiber.Ctx) error {
	// Implementation for generating 2FA setup
	return nil
}
func (h *AccountHandlerAG) HandleVerifyAndEnableTwoFA(c *fiber.Ctx) error {
	// Implementation for verifying and enabling 2FA
	return nil
}
func (h *AccountHandlerAG) HandleDisableTwoFA(c *fiber.Ctx) error {
	// Implementation for disabling 2FA
	return nil
}
