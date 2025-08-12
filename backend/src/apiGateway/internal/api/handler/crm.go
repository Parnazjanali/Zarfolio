package handler

import (
	"errors"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	"gold-api/internal/service/crm"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type CrmHandler struct {
	crmSvc crm.CrmService
	logger *zap.Logger
}

func NewCrmHandler(crmSvc crm.CrmService, logger *zap.Logger) (*CrmHandler, error) {
	defer logger.Sync()

	if crmSvc == nil {
		logger.Error("crmSvc is nil in NewCrmHandler", zap.String("service", "api-gateway"))
		return nil, fmt.Errorf("crmSvc cannot be nil for CrmHandler")
	}
	if logger == nil {
		logger.Error("logger is nil in NewCrmHandler", zap.String("service", "api-gateway"))
		return nil, fmt.Errorf("logger cannot be nil for CrmHandler")
	}

	logger.Debug("CrmHandler initialized successfully", zap.String("service", "api-gateway"))
	return &CrmHandler{crmSvc: crmSvc, logger: logger}, nil
}

func (h *CrmHandler) HandleGetAllCustomers(c *fiber.Ctx) error {
	defer h.logger.Sync()

	userID, _ := c.Locals("userID").(string)
	h.logger.Debug("Received request to get all customers", zap.String("user_id", userID))

	customers, err := h.crmSvc.GetAllCustomers(c.Context())
	if err != nil {
		h.logger.Error("Failed to fetch customers from service layer", zap.Error(err), zap.String("user_id", userID))
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "CRM service is temporarily unavailable"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to retrieve customers.", Details: err.Error()})
	}

	h.logger.Debug("Customers retrieved successfully", zap.Int("count", len(customers)), zap.String("user_id", userID))
	return c.JSON(customers)
}

func (h *CrmHandler) HandleCreateCustomer(c *fiber.Ctx) error {
	defer h.logger.Sync()

	userID, _ := c.Locals("userID").(string)
	userRoles, _ := c.Locals("userRoles").([]string)
	h.logger.Debug("Received request to create a new customer", zap.String("user_id", userID), zap.Strings("user_roles", userRoles))

	var req model.CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse request body", zap.Error(err), zap.String("user_id", userID))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request body", Details: err.Error()})
	}

	createdCustomer, err := h.crmSvc.CreateCustomer(c.Context(), &req)
	if err != nil {
		h.logger.Error("Failed to create customer via service layer", zap.Error(err), zap.String("user_id", userID))
		if strings.Contains(err.Error(), "already exists") {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "Customer with this code or mobile already exists."})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "CRM service is temporarily unavailable"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to create customer due to an internal error.", Details: err.Error()})
	}

	h.logger.Info("Customer created successfully.", zap.Uint("customer_id", createdCustomer.ID), zap.String("customer_code", createdCustomer.Code), zap.String("user_id", userID))
	return c.Status(fiber.StatusCreated).JSON(createdCustomer)
}

func (h *CrmHandler) HandleUpdateCustomer(c *fiber.Ctx) error {
	defer h.logger.Sync()

	customerID := c.Params("id")
	if customerID == "" {
		h.logger.Error("Customer ID is missing in update request.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Customer ID is required."})
	}

	userID, _ := c.Locals("userID").(string)
	userRoles, _ := c.Locals("userRoles").([]string)
	h.logger.Debug("Received request to update customer", zap.String("customer_id", customerID), zap.String("user_id", userID), zap.Strings("user_roles", userRoles))

	var req model.UpdateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse update customer request body", zap.Error(err), zap.String("user_id", userID))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request body", Details: err.Error()})
	}

	updatedCustomer, err := h.crmSvc.UpdateCustomer(c.Context(), customerID, &req)
	if err != nil {
		h.logger.Error("Failed to update customer via service layer", zap.Error(err), zap.String("user_id", userID))
		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "Customer not found."})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "CRM service is temporarily unavailable"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to update customer due to an internal error.", Details: err.Error()})
	}

	h.logger.Info("Customer updated successfully.", zap.Uint("customer_id", updatedCustomer.ID), zap.String("customer_code", updatedCustomer.Code), zap.String("user_id", userID))
	return c.JSON(updatedCustomer)
}

func (h *CrmHandler) HandleDeleteCustomer(c *fiber.Ctx) error {
	defer h.logger.Sync()

	customerID := c.Params("id")
	if customerID == "" {
		h.logger.Error("Customer ID is missing in delete request.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Customer ID is required."})
	}

	userID, _ := c.Locals("userID").(string)
	h.logger.Info("Handling request to delete customer", zap.String("customer_id", customerID), zap.String("user_id", userID))

	err := h.crmSvc.DeleteCustomer(c.Context(), customerID)
	if err != nil {
		h.logger.Error("Failed to delete customer via service layer", zap.Error(err), zap.String("user_id", userID))
		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "Customer not found."})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "CRM service is temporarily unavailable"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to delete customer due to an internal error.", Details: err.Error()})
	}

	h.logger.Info("Customer deleted successfully.", zap.String("customer_id", customerID), zap.String("user_id", userID))
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *CrmHandler) HandleCreateCustomerType(c *fiber.Ctx) error {
	defer h.logger.Sync()

	userID, _ := c.Locals("userID").(string)
	h.logger.Debug("Received request to create customer type", zap.String("user_id", userID))

	var req model.CusType
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse request body for customer type", zap.Error(err), zap.String("user_id", userID))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Invalid request body", Details: err.Error()})
	}

	newType, err := h.crmSvc.CreateCustomerTypes(c.Context(), req.Label)
	if err != nil {
		h.logger.Error("Failed to create customer type via service layer", zap.Error(err), zap.String("user_id", userID))
		if strings.Contains(err.Error(), "already exists") {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: "Customer type already exists"})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "CRM service is temporarily unavailable"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to create customer type due to an internal error", Details: err.Error()})
	}

	h.logger.Info("Customer type created successfully", zap.Uint("id", newType.ID), zap.String("label", newType.Label), zap.String("user_id", userID))
	return c.Status(fiber.StatusCreated).JSON(newType)
}

func (h *CrmHandler) HandleGetCustomerTypes(c *fiber.Ctx) error {
	defer h.logger.Sync()

	userID, _ := c.Locals("userID").(string)
	h.logger.Debug("Received request to create customer type", zap.String("user_id", userID))

	cusTypes, err := h.crmSvc.GetCustomerTypes(c.Context())
	if err != nil {
		h.logger.Error("Failed to fetch customer Types from service layer", zap.Error(err), zap.String("user_id", userID))
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "CRM service is temporarily unavailable"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to retrieve customer Types", Details: err.Error()})
	}
	h.logger.Debug("Customers retrieved successfully", zap.Int("count", len(cusTypes)), zap.String("user_id", userID))
	return c.JSON(cusTypes)
}

func (h *CrmHandler) HandleDeleteCustomerTypes (c *fiber.Ctx)error{
	defer h.logger.Sync()

	cusCode := c.Params("cusType_Code")
	if cusCode == "" {
		h.logger.Error("customer code  is missing in delete request.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "CustomerTypes code  is required."})
	}

	userID, _ := c.Locals("userID").(string)
	h.logger.Debug("Received request to create customer type", zap.String("user_id", userID))

	err := h.crmSvc.DeleteCustomerTypes(c.Context(), cusCode)
	if err != nil {
		h.logger.Error("Failed to delete cusType via service layer", zap.Error(err), zap.String("user_id", userID))
		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{Message: "Customer not found."})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: "CRM service is temporarily unavailable"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Failed to delete cusType due to an internal error.", Details: err.Error()})
	}

	h.logger.Info("cusType deleted successfully.", zap.String("customer_code", cusCode), zap.String("user_id", userID))
	return c.SendStatus(fiber.StatusNoContent)


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
