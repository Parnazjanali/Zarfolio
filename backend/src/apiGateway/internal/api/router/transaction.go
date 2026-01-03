package server

import (
	"fmt"
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"gold-api/internal/model"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpTransactionRoutes(apiGroup fiber.Router, transactionHandler *handler.TransactionHandler, authMiddleware *middleware.AuthMiddleware, logger *zap.Logger) error {
	defer logger.Sync()

	if transactionHandler == nil {
		logger.Error("TransactionHandler is nil in TransactionManager's SetUpTransactionRoutes.")
		return fmt.Errorf("transactionHandler is nil in TransactionManager's SetUpTransactionRoutes.")
	}
	if authMiddleware == nil {
		logger.Error("AuthMiddleware is nil in SetUpTransactionRoutes.")
		return fmt.Errorf("authMiddleware is nil in SetUpTransactionRoutes.")
	}

	transactionGroup := apiGroup.Group("/tr")
	logger.Debug("Configuring api/v1/tr protected routes")


	transactionGroup.Get("/transactions",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadGeneral), transactionHandler.HandleGetAllTransactions)

	transactionGroup.Post("/transactions",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionCreateSaleInvoice,
			model.PermTransactionCreatePurchaseInvoice,
		),
		transactionHandler.HandleCreateGenericTransaction)

	/*transactionGroup.Get("/:id",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetTransactionByID)

	transactionGroup.Put("/:id",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionUpdateSaleInvoice,
			model.PermTransactionUpdatePurchaseInvoice,
		),
		transactionHandlerAG.HandleUpdateTransaction)

	transactionGroup.Delete("/:id",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionDeleteSaleInvoice,
			model.PermTransactionDeletePurchaseInvoice,
		),
		transactionHandlerAG.HandleDeleteTransaction)

	// ----------------------
	// 2. تراکنش‌های فروش
	// ----------------------

	saleGroup := transactionGroup.Group("/sale")

	saleGroup.Post("/",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionCreateSaleInvoice),
		transactionHandlerAG.HandleCreateSaleTransaction)

	saleGroup.Post("/v2",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionCreateSaleInvoice),
		transactionHandlerAG.HandleCreateSaleTransactionV2)

	saleGroup.Get("/get/info/:code",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadSaleInvoice),
		transactionHandlerAG.HandleGetSaleInfo)

	saleGroup.Get("/rows/:code",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadSaleInvoice),
		transactionHandlerAG.HandleGetSaleRows)

	saleGroup.Post("/label/change",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionUpdateSaleInvoice),
		transactionHandlerAG.HandleChangeSaleLabel)

	saleGroup.Post("/edit/can/:code",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadSaleInvoice),
		transactionHandlerAG.HandleCanEditSaleTransaction)

	saleGroup.Put("/:id",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionUpdateSaleInvoice),
		transactionHandlerAG.HandleUpdateSaleTransaction)

	saleGroup.Delete("/:id",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionDeleteSaleInvoice),
		transactionHandlerAG.HandleDeleteSaleTransaction)

	// ----------------------
	// 3. تراکنش‌های خرید
	// ----------------------

	purchaseGroup := transactionGroup.Group("/purchase")

	purchaseGroup.Post("/",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionCreatePurchaseInvoice),
		transactionHandlerAG.HandleCreatePurchaseTransaction)

	purchaseGroup.Post("/v2",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionCreatePurchaseInvoice),
		transactionHandlerAG.HandleCreatePurchaseTransactionV2)

	purchaseGroup.Get("/get/info/:code",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadPurchaseInvoice),
		transactionHandlerAG.HandleGetPurchaseInfo)

	purchaseGroup.Get("/rows/:code",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadPurchaseInvoice),
		transactionHandlerAG.HandleGetPurchaseRows)

	purchaseGroup.Post("/label/change",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionUpdatePurchaseInvoice),
		transactionHandlerAG.HandleChangePurchaseLabel)

	purchaseGroup.Post("/edit/can/:code",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadPurchaseInvoice),
		transactionHandlerAG.HandleCanEditPurchaseTransaction)

	purchaseGroup.Put("/:id",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionUpdatePurchaseInvoice),
		transactionHandlerAG.HandleUpdatePurchaseTransaction)

	purchaseGroup.Delete("/:id",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionDeletePurchaseInvoice),
		transactionHandlerAG.HandleDeletePurchaseTransaction)

	// ----------------------
	// 4. تراکنش‌های خاص طلا و جواهر
	// ----------------------

	transactionGroup.Post("/deposit",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManagePayments),
		transactionHandlerAG.HandleDepositGold)

	transactionGroup.Post("/withdraw",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManagePayments),
		transactionHandlerAG.HandleWithdrawGold)

	transactionGroup.Post("/return-sale",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionCreateSaleInvoice),
		transactionHandlerAG.HandleReturnSaleTransaction)

	transactionGroup.Post("/return-purchase",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionCreatePurchaseInvoice),
		transactionHandlerAG.HandleReturnPurchaseTransaction)

	// ----------------------
	// 5. عملیات مالی
	// ----------------------

	paymentGroup := transactionGroup.Group("/payments")

	paymentGroup.Post("/",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManagePayments),
		transactionHandlerAG.HandlePaymentTransaction)

	paymentGroup.Post("/receipt",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManagePayments),
		transactionHandlerAG.HandleReceiptTransaction)

	paymentGroup.Post("/transfer",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManagePayments),
		transactionHandlerAG.HandleInternalTransfer)

	expenseGroup := transactionGroup.Group("/expenses")

	expenseGroup.Post("/",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManageExpenses),
		transactionHandlerAG.HandleCreateExpenseTransaction)

	expenseGroup.Put("/:id",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManageExpenses),
		transactionHandlerAG.HandleUpdateExpenseTransaction)

	expenseGroup.Delete("/:id",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManageExpenses),
		transactionHandlerAG.HandleDeleteExpenseTransaction)

	chequeGroup := transactionGroup.Group("/cheques")

	chequeGroup.Post("/",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManageCheques),
		transactionHandlerAG.HandleCreateChequeTransaction)

	chequeGroup.Put("/:id",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManageCheques),
		transactionHandlerAG.HandleUpdateChequeTransaction)

	chequeGroup.Delete("/:id",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManageCheques),
		transactionHandlerAG.HandleDeleteChequeTransaction)

	transactionGroup.Post("/:id/confirm",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionUpdateSaleInvoice,
			model.PermTransactionUpdatePurchaseInvoice,
		),
		transactionHandlerAG.HandleConfirmTransaction)

	transactionGroup.Post("/:id/revert",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionUpdateSaleInvoice,
			model.PermTransactionUpdatePurchaseInvoice,
		),
		transactionHandlerAG.HandleRevertTransaction)

	// ----------------------
	// 6. عملیات محاسباتی طلا
	// ----------------------

	calcGroup := transactionGroup.Group("/calculate")

	calcGroup.Post("/price",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleCalculateGoldPrice)

	calcGroup.Get("/daily-gold-rate",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetDailyGoldRate)

	calcGroup.Post("/set-gold-rate",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManageGoldRate),
		transactionHandlerAG.HandleSetGoldRate)

	// ----------------------
	// 7. مدیریت عیارها
	// ----------------------

	purityGroup := transactionGroup.Group("/purity")

	purityGroup.Get("/",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetPurityList)

	purityGroup.Post("/",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionCreateSaleInvoice,
			model.PermTransactionCreatePurchaseInvoice,
		),
		transactionHandlerAG.HandleCreatePurity)

	purityGroup.Get("/:id",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetPurityByID)

	purityGroup.Put("/:id",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionUpdateSaleInvoice,
			model.PermTransactionUpdatePurchaseInvoice,
		),
		transactionHandlerAG.HandleUpdatePurity)

	purityGroup.Delete("/:id",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionDeleteSaleInvoice,
			model.PermTransactionDeletePurchaseInvoice,
		),
		transactionHandlerAG.HandleDeletePurity)

	// ----------------------
	// 8. جستجو، فیلتر و داشبورد
	// ----------------------

	searchGroup := transactionGroup.Group("/search")

	searchGroup.Post("/",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleSearchTransactions)

	searchGroup.Post("/filter",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleFilterTransactions)

	transactionGroup.Get("/chart/data",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetTransactionChartData)

	transactionGroup.Get("/dashboard/stats",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetDashboardStats)

	// ----------------------
	// 9. گزارش‌گیری تخصصی
	// ----------------------

	reportsGroup := transactionGroup.Group("/reports")

	reportsGroup.Get("/daily",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleDailyReport)

	reportsGroup.Get("/monthly",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleMonthlyReport)

	reportsGroup.Get("/yearly",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleYearlyReport)

	reportsGroup.Get("/profit-loss",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleProfitLossReport)

	reportsGroup.Get("/cash-flow",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleCashFlowReport)

	reportsGroup.Get("/by-karat",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleReportByKarat)

	reportsGroup.Get("/by-purity",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleReportByPurity)

	reportsGroup.Get("/inventory",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleInventoryReport)

	reportsGroup.Get("/party/:partyId",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandlePartyReport)

	reportsGroup.Get("/party/:partyId/ledger",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandlePartyLedgerReport)

	// ----------------------
	// 10. سند و فاکتور
	// ----------------------

	saleDocumentGroup := transactionGroup.Group("/sale/:id")

	saleDocumentGroup.Get("/invoice",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadSaleInvoice),
		transactionHandlerAG.HandleGetSaleInvoicePDF)

	saleDocumentGroup.Post("/invoice/export",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadSaleInvoice),
		transactionHandlerAG.HandleExportSaleInvoiceToExcel)

	saleDocumentGroup.Get("/invoice/html",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadSaleInvoice),
		transactionHandlerAG.HandleGetSaleInvoiceHTML)

	saleDocumentGroup.Post("/invoice/print",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadSaleInvoice),
		transactionHandlerAG.HandlePrintSaleInvoice)

	purchaseDocumentGroup := transactionGroup.Group("/purchase/:id")

	purchaseDocumentGroup.Get("/invoice",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadPurchaseInvoice),
		transactionHandlerAG.HandleGetPurchaseInvoicePDF)

	purchaseDocumentGroup.Post("/invoice/export",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadPurchaseInvoice),
		transactionHandlerAG.HandleExportPurchaseInvoiceToExcel)

	purchaseDocumentGroup.Get("/invoice/html",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadPurchaseInvoice),
		transactionHandlerAG.HandleGetPurchaseInvoiceHTML)

	purchaseDocumentGroup.Post("/invoice/print",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionReadPurchaseInvoice),
		transactionHandlerAG.HandlePrintPurchaseInvoice)

	documentGroup := transactionGroup.Group("/:id")

	documentGroup.Get("/accounting-entry",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetAccountingEntry)

	documentGroup.Post("/accounting-entry/sync",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionUpdateSaleInvoice,
			model.PermTransactionUpdatePurchaseInvoice,
		),
		transactionHandlerAG.HandleSyncAccountingEntry)

	documentGroup.Get("/logs",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetTransactionLogs)

	// ----------------------
	// 11. مانده حساب و بدهی/بستانکاری
	// ----------------------

	balanceGroup := transactionGroup.Group("/balances")

	balanceGroup.Get("/party/:partyId",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetPartyBalance)

	balanceGroup.Get("/party/:partyId/history",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetBalanceHistory)

	balanceGroup.Get("/party/:partyId/ledger",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetPartyLedger)

	balanceGroup.Get("/inventory",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetInventoryBalance)

	balanceGroup.Get("/treasury",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetTreasuryBalance)

	// ----------------------
	// 12. ارتباط با ماژول‌های دیگر
	// ----------------------

	impactGroup := transactionGroup.Group("/:id")

	impactGroup.Get("/inventory-impact",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetInventoryImpact)

	impactGroup.Get("/treasury-impact",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetTreasuryImpact)

	impactGroup.Get("/accounting-impact",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetAccountingImpact)

	// ----------------------
	// 13. عملیات بچ و bulk
	// ----------------------

	bulkGroup := transactionGroup.Group("/bulk")

	bulkGroup.Post("/import",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionCreateSaleInvoice,
			model.PermTransactionCreatePurchaseInvoice,
		),
		transactionHandlerAG.HandleBulkImportTransactions)

	bulkGroup.Post("/export",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleBulkExportTransactions)

	bulkGroup.Post("/process",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionUpdateSaleInvoice,
			model.PermTransactionUpdatePurchaseInvoice,
		),
		transactionHandlerAG.HandleBulkProcessTransactions)

	// ----------------------
	// 14. تنظیمات و پیکربندی
	// ----------------------

	configGroup := transactionGroup.Group("/config")

	configGroup.Get("/gold-rate-settings",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetGoldRateSettings)

	configGroup.Post("/gold-rate-settings",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManageGoldRate),
		transactionHandlerAG.HandleUpdateGoldRateSettings)

	configGroup.Get("/transaction-types",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetTransactionTypes)

	configGroup.Post("/transaction-types",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionCreateSaleInvoice,
			model.PermTransactionCreatePurchaseInvoice,
		),
		transactionHandlerAG.HandleCreateTransactionType)

	// ----------------------
	// 15. API های خارجی و ادغام
	// ----------------------

	integrationGroup := transactionGroup.Group("/integration")

	integrationGroup.Post("/webhook",
		authMiddleware.AuthorizeMiddleware(model.PermTransactionManagePayments),
		transactionHandlerAG.HandleWebhook)

	integrationGroup.Get("/sync-status",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionReadPurchaseInvoice,
		),
		transactionHandlerAG.HandleGetSyncStatus)

	integrationGroup.Post("/sync",
		authMiddleware.AuthorizeMiddleware(
			model.PermTransactionUpdateSaleInvoice,
			model.PermTransactionUpdatePurchaseInvoice,
		),
		transactionHandler.HandleManualSync)

	*/

	logger.Debug("Transaction routes set up successfully.")
	return nil
}
