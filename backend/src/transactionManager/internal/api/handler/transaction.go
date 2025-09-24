package handler

import (
	"fmt"
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

