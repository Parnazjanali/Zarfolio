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
			Code: "400",
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

func (h *CrmHandler) HandleCreateCustomerTypes (c *fiber.Ctx) error{
	return  nil
}

func (h *CrmHandler) HandleDeleteCustomerTypes (c *fiber.Ctx)error{

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