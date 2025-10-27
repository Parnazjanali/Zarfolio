package transactionService

import (
	"context"
	"errors"
	"transaction-gold/internal/model"
	"transaction-gold/internal/repo"

	"go.uber.org/zap"
)

type TrService interface {
	GetAllTransactions(ctx context.Context) ([]model.Invoice, error)
	CreateGenericTransaction(ctx context.Context, invoice *model.Invoice) (*model.Invoice, error)
}

type TrServiceImpl struct {
	transactionRepo repo.TransactionRepo
	logger          *zap.Logger
}

func NewTrService(trRepo repo.TransactionRepo, logger *zap.Logger) (*TrServiceImpl, error) {
	if trRepo == nil {
		logger.Error("transaction repository is nil in NewTrService.")
	}
	if logger == nil {
		return nil, errors.New("logger cannot be nil for TrService")
	}

	logger.Debug("Initializing TrService...")

	return &TrServiceImpl{
		transactionRepo: trRepo,
		logger:          logger,
	}, nil
}

func (s *TrServiceImpl) GetAllTransactions(ctx context.Context) ([]model.Invoice, error) {

	s.logger.Debug("Getting all transactions...")

	transactions, err := s.transactionRepo.GetAllTransactions(ctx)
	if err != nil {
		s.logger.Error("Failed to get all transactions from repository.")
		return nil, err
	}

	return transactions, nil
}

func (s *TrServiceImpl) CreateGenericTransaction(ctx context.Context, invoice *model.Invoice) (*model.Invoice, error) {
	s.logger.Debug("Creating generic transaction...")

	transaction , err := s.transactionRepo.CreateGenericTransaction(ctx, invoice)
	if err != nil {
		s.logger.Error("Failed to create generic transaction in repository.")
		return nil, err
	}

	return transaction, nil
}