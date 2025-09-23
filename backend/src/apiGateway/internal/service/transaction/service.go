package transaction

import (
	"context"
	"fmt"
	"gold-api/internal/model"
	"gold-api/internal/service/transactionmanager"

	"go.uber.org/zap"
)

type TransactionService interface {
	GetAllTransactions(ctx context.Context) ([]model.Transaction, error)
	/*GetTransactionByID(ctx context.Context, id string) (model.Transaction, error)
	CreateTransaction(ctx context.Context, tx model.Transaction) (model.Transaction, error)
	UpdateTransaction(ctx context.Context, id string, tx model.Transaction) (model.Transaction, error)
	DeleteTransaction(ctx context.Context, id string) error*/
}

type TransactionServiceImpl struct {
	TransactionMngr transactionmanager.TransactionManagerClient
	logger          *zap.Logger
}

func NewTransactionService(client transactionmanager.TransactionManagerClient, logger *zap.Logger) (TransactionService, error) {
	if client == nil {

		logger.Error("TransactionManagerClient is nil", zap.String("reason", "transaction_manager_client_is_nil"))
		return nil, fmt.Errorf("TransactionManagerClient cannot be nil for TransactionService")
	}

	logger.Debug("TransactionService initialized successfully")
	return &TransactionServiceImpl{
		TransactionMngr: client,
		logger:          logger,
	}, nil

}

func (s *TransactionServiceImpl) GetAllTransactions(ctx context.Context) ([]model.Transaction, error) {

	s.logger.Debug("Fetching all transactions")

	transactions, err := s.TransactionMngr.GetAllTransactions(ctx)
	if err != nil {
		s.logger.Error("Failed to fetch transactions", zap.Error(err))
		return nil, err
	}
	return transactions, nil
}
