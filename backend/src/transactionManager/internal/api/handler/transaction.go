package handler

import "github.com/gofiber/fiber/v2"

type TransactionHandler struct {
}

func NewTransactionHandler() *TransactionHandler {
	return &TransactionHandler{}
}

func (h *TransactionHandler) HandleGetAllTransactions(c *fiber.Ctx) error {
	// Implementation for getting all transactions
	return nil
}
