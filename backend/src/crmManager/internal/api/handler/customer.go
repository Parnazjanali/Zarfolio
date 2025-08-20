package handler

import (
	"crm-gold/internal/model"
	commonService "crm-gold/internal/service/common"
	customerService "crm-gold/internal/service/customer"

	"crm-gold/internal/utils"
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type CrmHandler struct {
	crmSvc customerService.CusService
}

func NewCrmHandler(cus customerService.CusService) *CrmHandler {
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
			Code:    "400",
			Details: err.Error(),
		})
	}

	utils.Log.Info("CRM Manager received raw body", zap.ByteString("body", c.Body()))
	createdCustomer, err := h.crmSvc.CreateCustomer(c.Context(), &req)
	if err != nil {
		utils.Log.Error("Failed to create customer via service layer", zap.Error(err))

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

	utils.Log.Info("Customer created successfully.", zap.Uint("customer_id", createdCustomer.ID), zap.String("customer_code", createdCustomer.Code))
	return c.Status(fiber.StatusCreated).JSON(createdCustomer)
}

func (h *CrmHandler) HandleGetAllCustomers(c *fiber.Ctx) error {
	utils.Log.Info("Handling request to get all customers.")
	customers, err := h.crmSvc.GetAllCustomers(c.Context())
	if err != nil {
		utils.Log.Error("Failed to get customers via service layer", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to get customers due to an internal error.",
			Details: err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(customers)
}

func (h *CrmHandler) HandleUpdateCustomer(c *fiber.Ctx) error {
	customerID := c.Params("id")
	if customerID == "" {
		utils.Log.Error("Customer ID is missing in CRM update request.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Customer ID is required."})
	}

	var req model.UpdateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Error("Failed to parse request body for customer update in CRM", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body",
			Details: err.Error(),
		})
	}

	updatedCustomer, err := h.crmSvc.UpdateCustomer(c.Context(), customerID, &req)
	if err != nil {

		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{
				Message: "Customer not found.",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to update customer due to an internal error.",
			Details: err.Error(),
		})
	}

	return c.JSON(updatedCustomer)
}

func (h *CrmHandler) HandleDeleteCustomer(c *fiber.Ctx) error {

	customerID := c.Params("id")
	if customerID == "" {
		utils.Log.Error("Customer ID is missing in Delete request.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "Customer ID is required."})
	}

	utils.Log.Info("Handling request to delete customer", zap.String("customer_id", customerID))

	err := h.crmSvc.DeleteCustomer(c.Context(), customerID)
	if err != nil {
		utils.Log.Error("Failed to delete customer via service layer", zap.Error(err))

		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{
				Message: "Customer not found.",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to delete customer due to an internal error.",
			Details: err.Error(),
		})
	}

	utils.Log.Info("Customer deleted successfully.", zap.String("customer_id", customerID))
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *CrmHandler) HandleGetCustomerTypes(c *fiber.Ctx) error {

	utils.Log.Info("Handling request to get customer types.")
	cusTypes, err := h.crmSvc.GetCustomerTypes(c.Context())
	if err != nil {
		utils.Log.Error("Failed to get customer types via service layer", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to get customer types due to an internal error.",
			Details: err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(cusTypes)
}

func (h *CrmHandler) HandleCreateCustomerTypes(c *fiber.Ctx) error {

	var req model.CusType
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Warn("Failed to parse request body for creating customer type", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid JSON request body.",
		})
	}

	req.Label = strings.TrimSpace(req.Label)
	if req.Label == "" {
		utils.Log.Warn("Label is empty in create customer type request")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "The 'label' field is required and cannot be empty.",
		})
	}

	utils.Log.Info("Request received to create a new customer type", zap.String("label", req.Label))

	newCusType, err := h.crmSvc.CreateCustomerTypes(c.Context(), req.Label)
	if err != nil {
		utils.Log.Error("Service layer failed to create customer type", zap.String("label", req.Label), zap.Error(err))

		if errors.Is(err, commonService.ErrAlreadyExists) { 
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{
				Message: "A customer type with this label already exists.",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "An internal error occurred while creating the customer type.",
		})
	}

	 utils.Log.Info("Customer type created successfully", zap.String("label", newCusType.Label), zap.Uint("id", newCusType.ID))
	return c.Status(fiber.StatusCreated).JSON(newCusType)
}

func (h *CrmHandler) HandleDeleteCustomerTypes(c *fiber.Ctx) error {

	cusCode := c.Params("cusType_code")
	if cusCode == "" {
		utils.Log.Error("Custype Code  is missing in Delete request.")
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{Message: "cusType Code  is required."})
	}

	utils.Log.Info("Handling request to delete cusType", zap.String("cusType_code", cusCode))

	err := h.crmSvc.DeleteCustomerTypes(c.Context(), cusCode)
	if err != nil {
		utils.Log.Error("Failed to delete cusType via service layer", zap.Error(err))

		if strings.Contains(err.Error(), "not found") {
			return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{
				Message: "cusType not found.",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to delete cusType due to an internal error.",
			Details: err.Error(),
		})
	}

	utils.Log.Info("cusType deleted successfully.", zap.String("cusType_code", cusCode))
	return c.SendStatus(fiber.StatusNoContent)

}

func (h *CrmHandler) HandleGetCustomerByCode(c *fiber.Ctx) error {

    customerCode := c.Params("code")
    if customerCode == "" {
        utils.Log.Warn("Customer code is missing from the request URL")
        return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
            Message: "Customer code is required in the URL.",
        })
    }

   utils.Log.Info("Request received to get customer by code", zap.String("code", customerCode))

    customer, err := h.crmSvc.GetCustomerByCode(c.Context(), customerCode)
    if err != nil {
       utils.Log.Error("Service layer failed to get customer by code", zap.String("code", customerCode), zap.Error(err))
        
        if errors.Is(err, commonService.ErrNotFound) { 
            return c.Status(fiber.StatusNotFound).JSON(model.ErrorResponse{
                Message: "Customer with the specified code was not found.",
            })
        }
        
        return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
            Message: "An internal error occurred while fetching the customer.",
        })
    }

   utils.Log.Info("Customer retrieved successfully", zap.String("code", customer.Code))
    return c.Status(fiber.StatusOK).JSON(customer)
}

/*func (h *CrmHandler) HandleGetCustomerPrelabels(c *fiber.Ctx) error {

}*/

func (h *CrmHandler) HandleSearchCustomers(c *fiber.Ctx) error {
	var req model.CustomerSearchRequest
	if err := c.BodyParser(&req); err != nil {
		utils.Log.Warn("Failed to parse search request body", zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Invalid request body",
		})
	}

	if req.Page < 1 {
		req.Page = 1
	}
	if req.PageSize < 1 || req.PageSize > 100 {
		req.PageSize = 10
	}

	searchResponse, err := h.crmSvc.SearchCustomers(c.Context(), &req)
	if err != nil {
		utils.Log.Error("Failed to search customers via service layer", zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
			Message: "Failed to search customers due to an internal error.",
		})
	}

	utils.Log.Info("Customer search completed successfully.", zap.Int64("found_count", searchResponse.Total))
	return c.Status(fiber.StatusOK).JSON(searchResponse)
}

func (h *CrmHandler) HandleFilterCustomers(c *fiber.Ctx) error {
	return nil
}
