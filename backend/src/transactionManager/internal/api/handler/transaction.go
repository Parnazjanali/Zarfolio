package handler

import (
	"fmt"
	"strings"
	"transaction-gold/internal/model"
	transactionService "transaction-gold/internal/service/transaction"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type TransactionHandler struct {
	trSvc  transactionService.TrService
	logger *zap.Logger
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
	var req model.Invoice

	if err := c.BodyParser(&req); err != nil {
		h.logger.Error("Failed to parse request body.",
			zap.String("service", "transaction"),
			zap.String("operation", "CreateGenericTransaction"),
			zap.Error(err))
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	CreatedInvoice, err := h.trSvc.CreateGenericTransaction(c.Context(), &req)
	if err != nil {
		h.logger.Error("Failed to create generic transaction.",
			zap.String("service", "transaction"),
			zap.String("operation", "CreateGenericTransaction"),
			zap.Error(err))
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create generic transaction",
		})
	}

	if strings.Contains(CreatedInvoice.ID, "error-") {
		h.logger.Error("Service returned an error code in CreatedInvoice.ID",
			zap.String("service", "transaction"),
			zap.String("operation", "CreateGenericTransaction"),
			zap.String("error_code", CreatedInvoice.ID))
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": fmt.Sprintf("Service error: %s", CreatedInvoice.ID),
		})
	}

	h.logger.Info("Generic transaction created successfully.",
		zap.String("service", "transaction"),
		zap.String("operation", "CreateGenericTransaction"),
		zap.String("invoice_id", CreatedInvoice.ID))
	
	c.Status(fiber.StatusCreated).JSON(CreatedInvoice)

	return nil
}
