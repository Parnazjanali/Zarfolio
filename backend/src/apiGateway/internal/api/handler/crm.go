package handler

import (
	"gold-api/internal/model"
	"gold-api/internal/service/crm"
	"gold-api/internal/utils"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type CrmHandler struct {
	crmSvc crm.CrmService
	logger *zap.Logger
}

func NewCrmHandler(crmSvc crm.CrmService, logger *zap.Logger) *CrmHandler {
	if crmSvc == nil {
		logger.Fatal("crmSvc cannot be nil for CrmHandler.")
	}
	if logger == nil {
		logger.Fatal("logger cannot be nil for CrmHandler.")
	}
	return &CrmHandler{crmSvc: crmSvc, logger: logger}
}

func (h *CrmHandler) HandleGetAllCustomers(c *fiber.Ctx) error {
	h.logger.Info("Received request to get all customers.")

	customers, err := h.crmSvc.GetAllCustomers(c.Context())
	if err != nil {
		h.logger.Error("Failed to fetch customers from service layer", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to retrieve customers.",
			Details: err.Error(),
		})
	}

	return c.JSON(customers)

}

func (h *CrmHandler) HandleCreateCustomer(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User context missing."})
	}
	userRoles, ok := c.Locals("userRoles").([]string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Unauthorized: User roles missing."})
	}
	h.logger.Info("Creating customer", zap.String("user_id", userID), zap.Strings("user_roles", userRoles))

	var req model.CreateCustomerRequest

	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse request body from client", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request body", Details: err.Error()})
	}
	utils.Log.Info("API Gateway received model", zap.Any("request", req))

	h.logger.Info("Successfully parsed request body from client", zap.Any("request_body", req))

	createdCustomer, err := h.crmSvc.CreateCustomer(c.Context(), &req)
	if err != nil {
		h.logger.Error("Failed to create customer via service layer", zap.Error(err))

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

	h.logger.Info("Customer created successfully.", zap.Uint("customer_id", createdCustomer.ID), zap.String("customer_code", createdCustomer.Code))
	return c.Status(fiber.StatusCreated).JSON(createdCustomer)
}

func (h *CrmHandler) HandleUpdateCustomer(c *fiber.Ctx) error {
	// Implementation for updating a customer
	return nil
}
func (h *CrmHandler) HandleDeleteCustomer(c *fiber.Ctx) error {
	// Implementation for deleting a customer
	return nil
}
func (h *CrmHandler) HandleGetCustomerTypes(c *fiber.Ctx) error {
	// Implementation for getting customer types
	return nil
}
func (h *CrmHandler) HandleGetCustomerInfoByCode(c *fiber.Ctx) error {
	// Implementation for getting customer info by code
	return nil
}
func (h *CrmHandler) HandleGetCustomerPrelabels(c *fiber.Ctx) error {
	// Implementation for getting customer prelabels
	return nil
}
func (h *CrmHandler) HandleSearchCustomers(c *fiber.Ctx) error {
	// Implementation for searching customers
	return nil
}
func (h *CrmHandler) HandleFilterCustomers(c *fiber.Ctx) error {
	// Implementation for filtering customers
	return nil
}
func (h *CrmHandler) HandleGetSalespersons(c *fiber.Ctx) error {
	// Implementation for getting salespersons
	return nil
}
func (h *CrmHandler) HandleGroupUpdateCustomers(c *fiber.Ctx) error {
	// Implementation for group updating customers
	return nil
}
func (h *CrmHandler) HandleGroupDeleteCustomers(c *fiber.Ctx) error {
	// Implementation for group deleting customers
	return nil
}
func (h *CrmHandler) HandleGetDebtorCustomers(c *fiber.Ctx) error {
	// Implementation for getting debtor customers
	return nil
}
func (h *CrmHandler) HandleGetDepositorCustomers(c *fiber.Ctx) error {
	// Implementation for getting depositor customers
	return nil
}
func (h *CrmHandler) HandleImportCustomersExcel(c *fiber.Ctx) error {
	// Implementation for importing customers from Excel
	return nil
}
func (h *CrmHandler) HandleExportCustomersExcel(c *fiber.Ctx) error {
	// Implementation for exporting customers to Excel
	return nil
}
func (h *CrmHandler) HandleExportCustomersPdf(c *fiber.Ctx) error {
	// Implementation for exporting customers to PDF
	return nil
}
func (h *CrmHandler) HandleExportCustomerCardExcel(c *fiber.Ctx) error {
	// Implementation for exporting customer card to Excel
	return nil
}
func (h *CrmHandler) HandleExportCustomerCardPdf(c *fiber.Ctx) error {
	// Implementation for exporting customer card to PDF
	return nil
}
func (h *CrmHandler) HandleGetCustomersBySalesperson(c *fiber.Ctx) error {
	// Implementation for getting customers by salesperson
	return nil
}
func (h *CrmHandler) HandleGetCustomerBalance(c *fiber.Ctx) error {
	// Implementation for getting customer balance
	return nil
}

func (h *CrmHandler) HandleGetCustomerCard(c *fiber.Ctx) error {
	// Implementation for getting customer card
	return nil
}
