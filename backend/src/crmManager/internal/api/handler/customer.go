package handler

import (
	"crm-gold/internal/model"
	"crm-gold/internal/service"
	"crm-gold/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
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
	var req model.CreateCustomerRequest

	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse request body for customer creation", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body",
			Details: err.Error(),
		})
	}


	createdCustomer, err := h.crmSvc.CreateCustomer(c.Context(), &req)
	if err != nil {
		utils.Log.Error("Failed to create customer via service layer", zap.Error(err))

		// مدیریت خطاهای خاص از لایه سرویس
		if strings.Contains(err.Error(), "already exists") {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{
				Message: "Customer with this code or mobile already exists.",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to create customer due to an internal error.",
			Details: err.Error(),
		})
	}

	// 3. در صورت موفقیت، بازگرداندن پاسخ JSON
	utils.Log.Info("Customer created successfully.", zap.Uint("customer_id", createdCustomer.ID), zap.String("customer_code", createdCustomer.Code))
	return c.Status(fiber.StatusCreated).JSON(createdCustomer)
}

func (h *CrmHandler) HandleGetCustomers(c *fiber.Ctx) error {
	// Implement the logic for getting customers
	return nil
}
