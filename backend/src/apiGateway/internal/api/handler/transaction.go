package handler

import (
	"errors"
	"fmt"
	"gold-api/internal/model"
	service "gold-api/internal/service/common"
	"gold-api/internal/service/transaction"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

const (
	ServiceName       = "transaction"
	OperationCreate   = "CreateGenericTransaction"
	ErrorInvalidBody  = "Invalid request body"
	ErrorValidation   = "Validation failed: %s"
	ErrorUnauthorized = "User ID or roles not found in context"
	ErrorForbidden    = "Not authorized to create %s"
	ErrorDuplicate    = "Invoice with this number already exists"
	ErrorServiceDown  = "Transaction service is temporarily unavailable"
	ErrorService      = "Failed to create generic transaction due to an internal error"
	SuccessMessage    = "Generic transaction created successfully"
)

type TransactionHandler struct {
	TrSvc     transaction.TransactionService
	logger    *zap.Logger
	validator *validator.Validate
}

func NewTransactionHandler(trSvc transaction.TransactionService, logger *zap.Logger) (*TransactionHandler, error) {
	defer logger.Sync()

	if trSvc == nil {
		logger.Error("TransactionService is nil when passed to NewTransactionHandler",
			zap.String("service", "api-gateway"),
			zap.String("operation", "new-transaction-handler"))
		return nil, fmt.Errorf("TransactionService cannot be nil for TransactionHandler")
	}

	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for TransactionHandler")
	}

	logger.Debug("TransactionHandler initialized successfully",
		zap.String("service", "api-gateway"),
		zap.String("operation", "new-transaction-handler"))
	return &TransactionHandler{TrSvc: trSvc, logger: logger, validator: validator.New()}, 
		nil
}

func (h *TransactionHandler) HandleGetAllTransactions(c *fiber.Ctx) error {
	defer h.logger.Sync()

	transactions, err := h.TrSvc.GetAllTransactions(c.Context())
	if err != nil {
		h.logger.Error("Failed to get all transactions",
			zap.String("service", "api-gateway"),
			zap.String("operation", "get-all-transactions"),
			zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get all transactions"})
	}

	h.logger.Debug("Successfully retrieved all transactions",
		zap.Int("count", len(transactions)),
		zap.String("operation", "get-all-transactions"))
	return c.JSON(transactions)
}

func (h *TransactionHandler) HandleCreateGenericTransaction(c *fiber.Ctx) error {
	defer h.logger.Sync()

	userID, ok := c.Locals("userID").(string)
	if !ok {
		h.logger.Error("userID missing in context",
			zap.String("service", ServiceName),
			zap.String("operation", OperationCreate))
		return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
			Message: ErrorUnauthorized,
		})
	}

	h.logger.Debug("Received request to create a new transaction",
		zap.String("user_id", userID))

	var req model.CreateInvoiceRequest
	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse request body",
			zap.String("user_id", userID),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: ErrorInvalidBody,
			Details: err.Error(),
		})
	}

	if err := h.validator.Struct(req); err != nil {
		validationErrors := err.(validator.ValidationErrors)
		errorMessages := make([]string, 0)
		for _, e := range validationErrors {
			switch e.Tag() {
			case "required":
				errorMessages = append(errorMessages, fmt.Sprintf("%s is required", e.Field()))
			case "oneof":
				errorMessages = append(errorMessages, fmt.Sprintf("%s must be one of %s", e.Field(), e.Param()))
			case "gte":
				errorMessages = append(errorMessages, fmt.Sprintf("%s must be greater than or equal to %s", e.Field(), e.Param()))
			default:
				errorMessages = append(errorMessages, fmt.Sprintf("%s is invalid", e.Field()))
			}
		}
		h.logger.Error("Invalid request data",
			zap.String("user_id", userID),
			zap.Strings("validation_errors", errorMessages))
		return c.Status(fiber.StatusBadRequest).JSON(model.ErrorResponse{
			Message: "Validation failed",
			Details: strings.Join(errorMessages, "; "),
		})
	}


	createdInvoice, err := h.TrSvc.CreateGenericTransaction(c.Context(), &req, userID)
	if err != nil {
		h.logger.Error("Failed to create generic transaction",
			zap.String("user_id", userID),
			zap.Error(err))
		switch {
		case strings.Contains(err.Error(), "already exists"):
			return c.Status(fiber.StatusConflict).JSON(model.ErrorResponse{Message: ErrorDuplicate})
		case errors.Is(err, service.ErrTransactionManagerDown):
			return c.Status(fiber.StatusServiceUnavailable).JSON(model.ErrorResponse{Message: ErrorServiceDown})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
				Message: ErrorService,
				Details: err.Error(),
			})
		}
	}

	h.logger.Info("Transaction successfully created",
		zap.String("user_id", userID),
		zap.String("invoice_id", createdInvoice.ID),
		zap.String("invoice_number", createdInvoice.InvoiceNumber))

	return c.Status(fiber.StatusCreated).JSON(createdInvoice)
}

func (h *TransactionHandler) HandleGetAuditLog(c *fiber.Ctx) error {

	return nil
}
