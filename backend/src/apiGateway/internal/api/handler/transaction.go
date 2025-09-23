package handler

import (
	"fmt"
	"gold-api/internal/service/transaction"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type TransactionHandler struct {
	TransactionSvc transaction.TransactionService
	logger         *zap.Logger
}

func NewTransactionHandler(transactionSvc transaction.TransactionService, logger *zap.Logger) (*TransactionHandler, error) {
	defer logger.Sync()

	if transactionSvc == nil {
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
	return &TransactionHandler{TransactionSvc: transactionSvc, logger: logger}, nil
}

func (h *TransactionHandler) HandleGetAllTransactions (c *fiber.Ctx) error {
	defer h.logger.Sync()

	transactions, err := h.TransactionSvc.GetAllTransactions(c.Context())
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


func (h *TransactionHandler) HandleGetAuditLog (c *fiber.Ctx) error {

	return  nil
}
