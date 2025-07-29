package handler

import (
	"crm-gold/internal/service"
	"crm-gold/internal/utils"

	"github.com/gofiber/fiber/v2"
)

type CrmHandler struct {
	crmSvc service.CusService
}

func NewCrmHandler(cus service.CusService) *CrmHandler {
	if cus == nil {
		utils.Log.Fatal("crmSvc cannot be nil for CrmHandler in CrmManager.")
	}
	return &CrmHandler{crmSvc: cus}
}

func (h *CrmHandler) HandleCreateCustomer(c *fiber.Ctx) error {
	// Implement the logic for creating a customer
	return nil
}
func (h *CrmHandler) HandleGetCustomers(c *fiber.Ctx) error {
	// Implement the logic for getting customers
	return nil
}