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
		logger.Error("crmSvc is nil in NewCrmHandler",
			zap.String("service", "api-gateway"),
			zap.String("operation", "new-crm-handler"))
		return nil, fmt.Errorf("crmSvc cannot be nil for CrmHandler")
	}
	if logger == nil {
		logger.Error("logger is nil in NewCrmHandler",
			zap.String("service", "api-gateway"),
			zap.String("operation", "new-crm-handler"))
		return nil, fmt.Errorf("logger cannot be nil for CrmHandler")
	}

	logger.Debug("CrmHandler initialized successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "new-crm-handler"))
	return &CrmHandler{crmSvc: crmSvc, logger: logger}, nil
}

func (h *CrmHandler) HandleCreateCustomer(c *fiber.Ctx) error {
	defer h.logger.Sync()

	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Error("UserID not found in context for create customer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "create-customer"))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "UserID not found in request context",
			Code:    "401",
		})
	}
	userRoles, ok := c.Locals("userRoles").([]string)
	if !ok {
		userRoles = []string{}
	}
	h.logger.Debug("Received request to create a new customer",
		zap.String("service", "api-gateway"),
		zap.String("operation", "create-customer"),
		zap.String("user_id", userID),
		zap.Strings("user_roles", userRoles))

	var req model.CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse create customer request body",
			zap.String("service", "api-gateway"),
			zap.String("operation", "create-customer"),
			zap.String("user_id", userID),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body",
			Code:    "400",
			Details: err.Error(),
		})
	}

	h.logger.Debug("Successfully parsed create customer request body",
		zap.String("service", "api-gateway"),
		zap.String("operation", "create-customer"),
		zap.String("user_id", userID),
		zap.Any("request_body", req))

	createdCustomer, err := h.crmSvc.CreateCustomer(c.Context(), &req)
	if err != nil {
		h.logger.Error("Failed to create customer via service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "create-customer"),
			zap.String("user_id", userID),
			zap.Error(err))
		if strings.Contains(err.Error(), "already exists") {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{
				Message: "Customer with this code or mobile already exists",
				Code:    "409",
			})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "CRM service is temporarily unavailable",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to create customer due to an internal error",
			Code:    "500",
			Details: err.Error(),
		})
	}

	h.logger.Debug("Customer created successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "create-customer"),
		zap.String("user_id", userID),
		zap.Uint("customer_id", createdCustomer.ID),
		zap.String("customer_code", createdCustomer.Code))
	return c.Status(fiber.StatusCreated).JSON(createdCustomer)
}

func (h *CrmHandler) HandleUpdateCustomer(c *fiber.Ctx) error {
	defer h.logger.Sync()

	customerID := c.Params("id")
	if customerID == "" {
		h.logger.Error("Customer ID is missing in update request",
			zap.String("service", "api-gateway"),
			zap.String("operation", "update-customer"))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Customer ID is required",
			Code:    "400",
		})
	}

	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Error("UserID not found in context for update customer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "update-customer"),
			zap.String("customer_id", customerID))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "UserID not found in request context",
			Code:    "401",
		})
	}
	userRoles, ok := c.Locals("userRoles").([]string)
	if !ok {
		userRoles = []string{} 
	}
	h.logger.Debug("Received request to update customer",
		zap.String("service", "api-gateway"),
		zap.String("operation", "update-customer"),
		zap.String("customer_id", customerID),
		zap.String("user_id", userID),
		zap.Strings("user_roles", userRoles))

	var req model.UpdateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse update customer request body",
			zap.String("service", "api-gateway"),
			zap.String("operation", "update-customer"),
			zap.String("customer_id", customerID),
			zap.String("user_id", userID),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body",
			Code:    "400",
			Details: err.Error(),
		})
	}

	h.logger.Debug("Successfully parsed update customer request body",
		zap.String("service", "api-gateway"),
		zap.String("operation", "update-customer"),
		zap.String("customer_id", customerID),
		zap.String("user_id", userID),
		zap.Any("request_body", req))

	updatedCustomer, err := h.crmSvc.UpdateCustomer(c.Context(), customerID, &req)
	if err != nil {
		h.logger.Error("Failed to update customer via service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "update-customer"),
			zap.String("customer_id", customerID),
			zap.String("user_id", userID),
			zap.Error(err))
		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{
				Message: "Customer not found",
				Code:    "404",
			})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "CRM service is temporarily unavailable",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to update customer due to an internal error",
			Code:    "500",
			Details: err.Error(),
		})
	}

	h.logger.Debug("Customer updated successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "update-customer"),
		zap.String("customer_id", customerID),
		zap.String("user_id", userID),
		zap.Uint("customer_id_updated", updatedCustomer.ID),
		zap.String("customer_code", updatedCustomer.Code))
	return c.JSON(updatedCustomer)
}

func (h *CrmHandler) HandleGetAllCustomers(c *fiber.Ctx) error {
	defer h.logger.Sync()

	userID, _ := c.Locals("userID").(string)
	userRoles, _ := c.Locals("userRoles").([]string)
	h.logger.Debug("Received request to get all customers",
		zap.String("service", "api-gateway"),
		zap.String("operation", "get-all-customers"),
		zap.String("user_id", userID),
		zap.Strings("user_roles", userRoles))

	customers, err := h.crmSvc.GetAllCustomers(c.Context())
	if err != nil {
		h.logger.Error("Failed to fetch customers from service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "get-all-customers"),
			zap.String("user_id", userID),
			zap.Error(err))
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "CRM service is temporarily unavailable",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to retrieve customers",
			Code:    "500",
			Details: err.Error(),
		})
	}

	h.logger.Debug("Customers retrieved successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "get-all-customers"),
		zap.String("user_id", userID),
		zap.Int("customer_count", len(customers)))
	return c.JSON(customers)
}

func (h *CrmHandler) HandleDeleteCustomer(c *fiber.Ctx) error {
	defer h.logger.Sync()

	customerID := c.Params("id")
	if customerID == "" {
		h.logger.Error("Customer ID is missing in delete request",
			zap.String("service", "api-gateway"),
			zap.String("operation", "delete-customer"))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Customer ID is required",
			Code:    "400",
		})
	}

	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Error("UserID not found in context for delete customer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "delete-customer"),
			zap.String("customer_id", customerID))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "UserID not found in request context",
			Code:    "401",
		})
	}

	err := h.crmSvc.DeleteCustomer(c.Context(), customerID)
	if err != nil {
		h.logger.Error("Failed to delete customer via service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "delete-customer"),
			zap.String("customer_id", customerID),
			zap.String("user_id", userID),
			zap.Error(err))
		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{
				Message: "Customer not found",
				Code:    "404",
			})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "CRM service is temporarily unavailable",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to delete customer due to an internal error",
			Code:    "500",
			Details: err.Error(),
		})
	}

	h.logger.Debug("Customer deleted successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "delete-customer"),
		zap.String("customer_id", customerID),
		zap.String("user_id", userID))
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *CrmHandler) HandleCreateCustomerType(c *fiber.Ctx) error {
	/*defer h.logger.Sync()

	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		h.logger.Error("UserID not found in context for create customer type",
			zap.String("service", "api-gateway"),
			zap.String("operation", "create-customer-type"))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: "UserID not found in request context",
			Code:    "401",
		})
	}

	var req model.CusType
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse create customer type request body",
			zap.String("service", "api-gateway"),
			zap.String("operation", "create-customer-type"),
			zap.String("user_id", userID),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body",
			Code:    "400",
			Details: err.Error(),
		})
	}

	h.logger.Debug("Successfully parsed create customer type request body",
		zap.String("service", "api-gateway"),
		zap.String("operation", "create-customer-type"),
		zap.String("user_id", userID),
		zap.Any("request_body", req))

	newType, err := h.crmSvc.CreateCustomerTypes(c.Context(), &req)
	if err != nil {
		h.logger.Error("Failed to create customer type via service layer",
			zap.String("service", "api-gateway"),
			zap.String("operation", "create-customer-type"),
			zap.String("user_id", userID),
			zap.Error(err))
		if strings.Contains(err.Error(), "already exists") {
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{
				Message: "Customer type already exists",
				Code:    "409",
			})
		}
		if errors.Is(err, service.ErrCrmManagerDown) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{
				Message: "CRM service is temporarily unavailable",
				Code:    "503",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to create customer type due to an internal error",
			Code:    "500",
			Details: err.Error(),
		})
	}

	h.logger.Debug("Customer type created successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "create-customer-type"),
		zap.String("user_id", userID),
		zap.String("type_name", newType.Name))
	return c.Status(fiber.StatusCreated).JSON(newType)*/
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
