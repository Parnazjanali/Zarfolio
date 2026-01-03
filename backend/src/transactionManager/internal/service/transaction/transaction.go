package transactionService

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"
	"transaction-gold/internal/model"
	"transaction-gold/internal/repository/repo"
	crmService "transaction-gold/internal/service/crm"
	inventoryService "transaction-gold/internal/service/inventory"
	"transaction-gold/internal/utils"

	"go.uber.org/zap"
)

type TrService interface {
	GetAllTransactions(ctx context.Context) ([]model.Invoice, error)
	CreateGenericTransaction(ctx context.Context, req *model.CreateInvoiceRequest) (*model.Invoice, error)
}

type TrServiceImpl struct {
	transactionRepo repo.TransactionRepo
	inventoryClient inventoryService.InventoryServiceClient
	customerClient  crmService.CrmServiceClient
	logger          *zap.Logger
}

func NewTrService(trRepo repo.TransactionRepo, inventoryClient inventoryService.InventoryServiceClient, customerClient crmService.CrmServiceClient, logger *zap.Logger) (*TrServiceImpl, error) {
	if trRepo == nil {
		logger.Error("transaction repository is nil in NewTrService.")
	}
	if inventoryClient == nil {
		logger.Error("inventory client is nil in NewTrService.")
	}
	if logger == nil {
		return nil, errors.New("logger cannot be nil for TrService")
	}

	logger.Debug("Initializing TrService...")

	return &TrServiceImpl{
		transactionRepo: trRepo,
		inventoryClient: inventoryClient,
		customerClient:  customerClient,
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
func (s *TrServiceImpl) CreateGenericTransaction(ctx context.Context, req *model.CreateInvoiceRequest) (*model.Invoice, error) {
	s.logger.Info("Starting CreateGenericTransaction",
		zap.String("user_id", req.UserID),
		zap.String("flow_type", req.FlowType))

	if req.CustomerID == "" {
		return nil, errors.New("customer ID is required")
	}
	if len(req.Items) == 0 {
		return nil, errors.New("invoice must have items")
	}
	if s.customerClient == nil {
		return nil, errors.New("system error: customer client not initialized")
	}

	slimCustomer, err := s.resolveCustomer(ctx, req.CustomerID, req.CustomerName)
	if err != nil {
		return nil, err
	}
	if slimCustomer.Status != "Active" {
		return nil, errors.New("customer is not active")
	}

	invoiceID := utils.GenerateUUID()

	invoiceDate := req.InvoiceDate
	if invoiceDate.IsZero() {
		invoiceDate = time.Now()
	}

	invoice := &model.Invoice{
		ID:              invoiceID,
		InvoiceNumber:   req.InvoiceNumber,
		CustomerID:      slimCustomer.ID,
		CustomerName:    slimCustomer.Name,
		InvoiceDate:     invoiceDate,
		FlowType:        req.FlowType,
		DocumentSubType: req.DocumentSubType,
		Currency:        req.Currency,
		CurrencyRate:    req.CurrencyRate,
		TaxAmount:       req.TaxAmount,
		DiscountAmount:  req.DiscountAmount,
		Notes:           req.Notes,
		CreatedBy:       req.UserID,
		Status:          "pending_inventory",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Items:           make([]model.InvoiceItem, 0, len(req.Items)),
	}

	for _, itemReq := range req.Items {
		invoice.Items = append(invoice.Items, model.InvoiceItem{
			ID:              utils.GenerateUUID(),
			InvoiceID:       invoiceID,
			Type:            itemReq.Type,
			Description:     itemReq.Description,
			Quantity:        itemReq.Quantity,
			Weight:          itemReq.Weight,
			Purity:          itemReq.Purity,
			BaseGoldPrice:   itemReq.BaseGoldPrice,
			UnitPrice:       itemReq.UnitPrice,
			DiscountPercent: itemReq.DiscountPercent,
			DiscountAmount:  itemReq.DiscountAmount,
			TaxAmount:       itemReq.TaxAmount,
			CommodityID:     itemReq.CommodityID,
			CommodityCode:   itemReq.CommodityCode,
			Notes:           itemReq.Notes,
			ItemWeightNet:   itemReq.ItemWeightNet,
			LaborFee:        itemReq.LaborFee,
			StoneValue:      itemReq.StoneValue,
		})
	}

	if err := s.calculateInvoiceTotals(invoice); err != nil {
		s.logger.Error("Calculation failed", zap.Error(err))
		return nil, fmt.Errorf("calculation error: %w", err)
	}

	if invoice.InvoiceNumber == "" {
		newNum, err := s.GenerateUniqueInvoiceNumber(ctx)
		if err != nil {
			return nil, fmt.Errorf("number generation failed: %w", err)
		}
		invoice.InvoiceNumber = newNum
	}

	createdInvoice, err := s.transactionRepo.CreateGenericTransaction(ctx, invoice)
	if err != nil {
		s.logger.Error("DB Save failed", zap.Error(err))
		return nil, fmt.Errorf("database save failed: %w", err)
	}

	stockItems := s.mapToStockItems(createdInvoice)
	var inventoryErr error

	// Payable (خرید) -> افزایش موجودی
	// Receivable (فروش) -> کاهش موجودی
	if req.FlowType == "payable" {
		inventoryErr = s.inventoryClient.IncreaseStock(ctx, stockItems)
	} else {
		inventoryErr = s.inventoryClient.DecreaseStock(ctx, stockItems)
	}

	if inventoryErr != nil {
		s.logger.Error("Inventory update failed, rolling back status",
			zap.String("id", createdInvoice.ID),
			zap.Error(inventoryErr))

		// وضعیت فاکتور را به "خطا" تغییر می‌دهیم تا بعدا ادمین بررسی کند
		if upErr := s.transactionRepo.UpdateInvoiceStatus(ctx, createdInvoice.ID, "FAILED_INVENTORY"); upErr != nil {
			s.logger.Error("CRITICAL: Failed to update status to FAILED", zap.Error(upErr))
		}

		return nil, fmt.Errorf("transaction saved but inventory failed: %w", inventoryErr)
	}

	// 7. Final Success
	// آپدیت وضعیت به completed
	// نکته: اگر این آپدیت فیل شود، فاکتور در حالت pending می‌ماند که در انبار اعمال شده.
	// معمولا یک جاب پس‌زمینه (Cron Job) این موارد را چک می‌کند.
	s.transactionRepo.UpdateInvoiceStatus(ctx, createdInvoice.ID, "completed")
	createdInvoice.Status = "completed"

	s.logger.Info("Transaction finalized successfully", zap.String("id", createdInvoice.ID))
	return createdInvoice, nil
}

func (s *TrServiceImpl) calculateInvoiceTotals(inv *model.Invoice) error {
	var runningTotal float64
	var totalTax float64
	var totalWeight float64
	var totalPureWeight float64

	for i := range inv.Items {
		item := &inv.Items[i]

		// ۱. محاسبه UnitPrice (قیمت واحد هر گرم یا عدد)
		if item.UnitPrice == 0 {
			// (قیمت پایه طلا + اجرت) + ارزش سنگ
			item.UnitPrice = (item.Weight * item.BaseGoldPrice) + item.LaborFee + item.StoneValue
		}

		// ۲. محاسبات وزنی
		totalWeight += item.Weight
		// محاسبه وزن خالص (مثلاً اگر عیار ۱۸ یا ۷۵۰ است)
		if item.Purity > 0 {
			totalPureWeight += (item.Weight * item.Purity) / 750
		}

		// ۳. محاسبات مالی سطر
		lineTotal := item.UnitPrice * item.Quantity
		lineDiscount := (lineTotal * item.DiscountPercent / 100) + item.DiscountAmount
		lineNet := lineTotal - lineDiscount

		// ۴. مالیات سطر
		item.TaxAmount = lineNet * 0.09

		runningTotal += lineNet
		totalTax += item.TaxAmount
	}

	// ۵. مقداردهی نهایی مدل Invoice
	inv.TotalWeight = totalWeight
	inv.TotalPureWeight = totalPureWeight
	inv.TaxAmount = totalTax

	// ۶. مبلغ نهایی قابل پرداخت
	inv.GrandTotal = (runningTotal + totalTax) - inv.DiscountAmount

	if inv.CurrencyRate > 0 && inv.Currency != "IRR" {
		inv.GrandTotal = inv.GrandTotal * inv.CurrencyRate
	}

	return nil
}

func (s *TrServiceImpl) GenerateUniqueInvoiceNumber(ctx context.Context) (string, error) {

	lastNum, err := s.transactionRepo.GetLastInvoiceSerialNumber(ctx)
	if err != nil {
		s.logger.Error("Failed to fetch last serial number", zap.Error(err))
		return "", err
	}

	nextNum := lastNum + 1

	year := time.Now().Year()

	// فرمت خروجی: INV-1404/00001
	invoiceNumber := fmt.Sprintf("INV-%d/%05d", year, nextNum)

	return invoiceNumber, nil
}

func (s *TrServiceImpl) mapToStockItems(invoice *model.Invoice) []model.StockChangeItem {
	var items []model.StockChangeItem
	for _, item := range invoice.Items {

		if item.CommodityID != nil {
			items = append(items, model.StockChangeItem{
				CommodityID:     *item.CommodityID,
				TransactionType: invoice.DocumentSubType,
				NetWeightChange: item.ItemWeightNet,
				Purity:          item.Purity,
			})
		}
	}
	return items
}

func (s *TrServiceImpl) resolveCustomer(ctx context.Context, id string, name string) (*model.SlimCustomer, error) {
	if s.customerClient == nil {
		return nil, errors.New("crm client is not initialized")
	}

	if strings.HasPrefix(id, "temp-") {
		return nil, fmt.Errorf("invalid customer ID: temporary IDs are not allowed")
	}
	if id == "" {
		s.logger.Info("Customer ID is empty, creating new customer", zap.String("name", name))
		return s.customerClient.CreateCustomer(ctx, name)
	}

	slimCustomers, err := s.customerClient.GetCustomer(ctx, id, name)
	if err != nil {

		if utils.IsNotFoundError(err) {
			s.logger.Info("Customer not found, creating new one...", zap.String("name", name))
			return s.customerClient.CreateCustomer(ctx, name)
		}

		return nil, fmt.Errorf("crm service error while getting customer: %w", err)
	}

	if len(slimCustomers) == 0 {
		s.logger.Info("No customer found with given ID/name, creating new one...", zap.String("name", name))
		return s.customerClient.CreateCustomer(ctx, name)
	}

	s.logger.Info("Customer resolved successfully",
    zap.Int("customer_id", slimCustomers[0].ID), 
    zap.String("code", slimCustomers[0].Code))
	return &slimCustomers[0], nil
}
