package handler

import (
	service "profile-gold/internal/service/account"
	"profile-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AccountHandler struct {
	userService service.AccountService
}

func NewAccountHandler(us service.AccountService) *AccountHandler {
	if us == nil {
		utils.Log.Fatal("UserService cannot be nil for ProfileHandler in Profile Manager.")
	}
	return &AccountHandler{userService: us}
}


func (h *AccountHandler) ChangeUsername(c *fiber.Ctx) error {
	utils.Log.Info("ChangeUsername endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Change Username endpoint hit (placeholder)"})
}

func (h *AccountHandler) ChangePassword(c *fiber.Ctx) error {
	utils.Log.Info("ChangePassword endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Change Password endpoint hit (placeholder)"})
}

func (h *AccountHandler) UploadProfilePicture(c *fiber.Ctx) error {
	utils.Log.Info("UploadProfilePicture endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Upload Profile Picture endpoint hit (placeholder)"})
}

func (h *AccountHandler) GenerateTwoFASetup(c *fiber.Ctx) error {
	utils.Log.Info("GenerateTwoFASetup endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Generate Two-Factor Authentication Setup endpoint hit (placeholder)"})
}

func (h *AccountHandler) VerifyAndEnableTwoFA(c *fiber.Ctx) error {
	utils.Log.Info("VerifyAndEnableTwoFA endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Verify and Enable Two-Factor Authentication endpoint hit (placeholder)"})
}

func (h *AccountHandler) DisableTwoFA(c *fiber.Ctx) error {
	utils.Log.Info("DisableTwoFA endpoint hit. Placeholder.", zap.String("ip", c.IP()))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Disable Two-Factor Authentication endpoint hit (placeholder)"})
}


