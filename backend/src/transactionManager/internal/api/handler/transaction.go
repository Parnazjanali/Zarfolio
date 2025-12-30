package handler

import (
	"fmt"
	"transaction-gold/internal/model"
	transactionService "transaction-gold/internal/service/transaction"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type TransactionHandler struct {
	trSvc     transactionService.TrService
	logger    *zap.Logger
	validator *validator.Validate
}

func NewTransactionHandler(tr transactionService.TrService, logger *zap.Logger) (*TransactionHandler, error) {
	defer logger.Sync()
	if tr == nil {
		logger.Error("transaction service is nil in NewTransactionHandler.",
			zap.String("service", "transaction"),
			zap.String("operation", "Get-all-transaction"))
	}
	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for TransactionHandler")
	}

	logger.Debug("Initializing TransactionHandler...",
		zap.String("service", "transaction"),
		zap.String("operation", "NewTransactionHandler"))

	return &TransactionHandler{
		trSvc:  tr,
		logger: logger,
	}, nil
}

func (h *TransactionHandler) HandleGetAllTransactions(c *fiber.Ctx) error {

	h.logger.Debug("Handling GetAllTransactions...",
		zap.String("service", "transaction"),
		zap.String("operation", "GetAllTransactions"))

	transactions, err := h.trSvc.GetAllTransactions(c.Context())
	if err != nil {
		h.logger.Error("Failed to get all transactions.",
			zap.String("service", "transaction"),
			zap.String("operation", "GetAllTransactions"),
			zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get all transactions",
		})
	}

	return c.JSON(transactions)
}

func (h *TransactionHandler) HandleCreateGenericTransaction(c *fiber.Ctx) error {
    var req model.CreateInvoiceRequest

    h.logger.Info("Starting to handle CreateGenericTransaction",
        zap.String("service", "transaction"),
        zap.String("operation", "HandleCreateGenericTransaction"))

    if err := c.BodyParser(&req); err != nil {
        h.logger.Error("Failed to parse request body",
            zap.String("operation", "HandleCreateGenericTransaction"),
            zap.Error(err))
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error": " format errors in request body",
        })
    }

    if err := h.validator.Struct(req); err != nil {
        h.logger.Warn("Validation failed for create transaction request",
            zap.String("operation", "HandleCreateGenericTransaction"),
            zap.String("customer", req.CustomerName),
            zap.Error(err))
        
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
            "error":   "failed validation",
            "details": err.Error(), 
        })
    }

    createdInvoice, err := h.trSvc.CreateGenericTransaction(c.Context(), &req)
    if err != nil {
        h.logger.Error("Failed to create generic transaction in service layer",
            zap.String("operation", "HandleCreateGenericTransaction"),
            zap.String("customer_id", req.CustomerID),
            zap.Error(err))
            
        return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
            "error": err.Error(),
        })
    }

    h.logger.Info("Generic transaction created successfully",
        zap.String("operation", "HandleCreateGenericTransaction"),
        zap.String("invoice_id", createdInvoice.ID),
        zap.String("invoice_number", createdInvoice.InvoiceNumber))

    return c.Status(fiber.StatusCreated).JSON(createdInvoice)
}