package transactionService

import (
	"context"
	"errors"
	"fmt"
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
	s.logger.Info("Attempting to create a new generic transaction in service layer.",
		zap.String("customer_id", req.CustomerID),
		zap.String("flow_type", req.FlowType))

	if req.CustomerID == "" {
		return nil, errors.New("customer ID is required for the invoice")
	}
	if len(req.Items) == 0 {
		return nil, errors.New("invoice must contain at least one item")
	}

	invoiceID := utils.GenerateUUID()
	invoice := &model.Invoice{
		ID:              invoiceID,
		InvoiceNumber:   req.InvoiceNumber,
		CustomerID:      req.CustomerID,
		CustomerName:    req.CustomerName,
		InvoiceDate:     req.InvoiceDate,
		FlowType:        req.FlowType,
		DocumentSubType: req.DocumentSubType,
		Currency:        req.Currency,
		CurrencyRate:    req.CurrencyRate,
		TaxAmount:       req.TaxAmount,
		DiscountAmount:  req.DiscountAmount,
		Notes:           req.Notes,
		Status:          "pending_inventory",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if invoice.InvoiceDate.IsZero() {
		invoice.InvoiceDate = time.Now()
	}

	for _, itemReq := range req.Items {
		invoiceItem := model.InvoiceItem{
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
		}
		invoice.Items = append(invoice.Items, invoiceItem)
	}

	err := s.calculateInvoiceTotals(invoice)
	if err != nil {
		s.logger.Error("Failed to calculate invoice totals.", zap.Error(err))
		return nil, fmt.Errorf("failed to calculate invoice totals: %w", err)
	}

	if invoice.InvoiceNumber == "" {
		newNumber, err := s.GenerateUniqueInvoiceNumber(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to generate unique invoice number: %w", err)
		}
		invoice.InvoiceNumber = newNumber
	}

	slimCustomer, err := s.customerClient.GetOrCreateCustomer(ctx, req.CustomerID, req.CustomerName)
	if err != nil {
		return nil, fmt.Errorf("crm service error: %w", err)
	}

	if slimCustomer.Status != "Active" {
		return nil, errors.New("customer is not active")
	}

	invoice.CustomerID = slimCustomer.ID
	invoice.CustomerName = slimCustomer.Name

	createdInvoice, err := s.transactionRepo.CreateGenericTransaction(ctx, invoice)
	if err != nil {
		s.logger.Error("Failed to save transaction.", zap.Error(err))
		return nil, fmt.Errorf("failed to save transaction: %w", err)
	}

	stockItems := s.mapToStockItems(createdInvoice)

	var inventoryErr error

	if req.FlowType == "payable" {

		inventoryErr = s.inventoryClient.DecreaseStock(ctx, stockItems)

	} else {

		inventoryErr = s.inventoryClient.IncreaseStock(ctx, stockItems)
	}

	if inventoryErr != nil {
		s.logger.Error("Inventory update failed, rolling back invoice status",
			zap.String("id", createdInvoice.ID),
			zap.Error(inventoryErr))

		updateErr := s.transactionRepo.UpdateInvoiceStatus(ctx, createdInvoice.ID, "FAILED_INVENTORY")
		if updateErr != nil {
			s.logger.Error("CRITICAL: Failed to update invoice status after inventory failure", zap.Error(updateErr))
		}

		return nil, errors.New("transaction created but inventory update failed: " + inventoryErr.Error())
	}

	s.transactionRepo.UpdateInvoiceStatus(ctx, createdInvoice.ID, "completed")
	createdInvoice.Status = "completed"

	s.logger.Info("Generic transaction completed successfully.",
		zap.String("invoice_id", createdInvoice.ID))

	return createdInvoice, nil
}

func (s *TrServiceImpl) calculateInvoiceTotals(invoice *model.Invoice) error {
	var grandTotal, totalTax, totalDiscount float64

	for i := range invoice.Items {
		item := &invoice.Items[i]

		// ۱. محاسبه UnitPrice بر اساس منطق طلا (اگر صفر باشد)
		// فرمول: ((وزن خالص * قیمت خام طلا) + اجرت + ارزش سنگ) / تعداد
		if item.UnitPrice == 0 {
			goldValue := item.ItemWeightNet * item.BaseGoldPrice
			// قیمت واحد برای هر عدد کالا
			item.UnitPrice = (goldValue + item.LaborFee + item.StoneValue) / item.Quantity
		}

		// ۲. محاسبه قیمت کل ردیف قبل از تخفیف
		rowTotalBeforeDiscount := item.Quantity * item.UnitPrice

		// ۳. محاسبه تخفیف (اولویت با مبلغ مستقیم، سپس درصد)
		if item.DiscountAmount == 0 && item.DiscountPercent > 0 {
			item.DiscountAmount = rowTotalBeforeDiscount * (item.DiscountPercent / 100.0)
		}

		item.TotalPrice = rowTotalBeforeDiscount - item.DiscountAmount

		// ۴. محاسبه مالیات (Tax) - منطق تخصصی طلا
		// معمولاً مالیات ۹٪ فقط روی (اجرت + سود + ارزش سنگ) اعمال می‌شود، نه اصل طلا.
		// اما برای سادگی فعلاً اگر TaxAmount صفر بود، ۹ درصد روی TotalPrice حساب می‌کنیم:
		if item.TaxAmount == 0 {
			// نکته: اگر TaxBase برابر با "profit_only" باشد، محاسبات متفاوت خواهد بود
			// فعلاً استاندارد کل سطر:
			// item.TaxAmount = item.TotalPrice * 0.09
		}

		grandTotal += item.TotalPrice
		totalDiscount += item.DiscountAmount
		totalTax += item.TaxAmount
	}

	invoice.DiscountAmount = totalDiscount
	invoice.TaxAmount = totalTax
	invoice.GrandTotal = grandTotal + totalTax

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
