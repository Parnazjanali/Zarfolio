package router

import (
	"fmt"
	"transaction-gold/internal/api/handler"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func SetUpTransactionRoutes(app *fiber.App, transactionHandler *handler.TransactionHandler, logger *zap.Logger) error {
	if app == nil {
		return fmt.Errorf("fiber app instance cannot be nil in TransactionManager.")
	}
	if transactionHandler == nil {
		return fmt.Errorf("transactionHandler is nil in TransactionManager's SetUpTransactionRoutes.")
	}

	transactionGroup := app.Group("/tr")
	logger.Info("Setting up transaction routes...")

	// ----------------------
	// 1. عملیات اصلی CRUD
	// ----------------------

	transactionGroup.Get("/transactions", transactionHandler.HandleGetAllTransactions)
	transactionGroup.Post("/transactions", transactionHandler.HandleCreateGenericTransaction)
	/*transactionGroup.Get("/:id", transactionHandler.HandleGetTransactionByID)
	transactionGroup.Put("/:id", transactionHandler.HandleUpdateTransaction)
	transactionGroup.Delete("/:id", transactionHandler.HandleDeleteTransaction)

	// کنترل امکان ویرایش (از SellController)
	transactionGroup.Post("/edit/can/:code", transactionHandler.HandleCanEditTransaction)

	// ----------------------
	// 2. تراکنش‌های خاص طلا و جواهر
	// ----------------------

	// فروش و خرید
	saleGroup := transactionGroup.Group("/sale")
	saleGroup.Post("/", transactionHandler.HandleCreateSaleTransaction)
	saleGroup.Post("/v2", transactionHandler.HandleCreateSaleTransactionV2) // نسخه پیشرفته
	saleGroup.Get("/rows/:code", transactionHandler.HandleGetSaleRows)
	saleGroup.Post("/label/change", transactionHandler.HandleChangeSaleLabel)
	saleGroup.Get("/get/info/:code", transactionHandler.HandleGetSaleInfo)

	purchaseGroup := transactionGroup.Group("/purchase")
	purchaseGroup.Post("/", transactionHandler.HandleCreatePurchaseTransaction)
	purchaseGroup.Post("/v2", transactionHandler.HandleCreatePurchaseTransactionV2)

	// مرجوعی‌ها
	transactionGroup.Post("/return-sale", transactionHandler.HandleReturnSaleTransaction)
	transactionGroup.Post("/return-purchase", transactionHandler.HandleReturnPurchaseTransaction)

	// امانت‌گذاری و برداشت طلا
	transactionGroup.Post("/deposit", transactionHandler.HandleDepositGold)
	transactionGroup.Post("/withdraw", transactionHandler.HandleWithdrawGold)

	// پرداخت و دریافت
	transactionGroup.Post("/payment", transactionHandler.HandlePaymentTransaction)
	transactionGroup.Post("/receipt", transactionHandler.HandleReceiptTransaction)
	transactionGroup.Post("/transfer", transactionHandler.HandleInternalTransfer)

	// تأیید و برگشت تراکنش
	transactionGroup.Post("/:id/confirm", transactionHandler.HandleConfirmTransaction)
	transactionGroup.Post("/:id/revert", transactionHandler.HandleRevertTransaction)

	// ----------------------
	// 3. عملیات محاسباتی طلا
	// ----------------------

	// محاسبه قیمت طلا
	calcGroup := transactionGroup.Group("/calculate")
	calcGroup.Post("/price", transactionHandler.HandleCalculateGoldPrice)
	calcGroup.Get("/daily-gold-rate", transactionHandler.HandleGetDailyGoldRate)
	calcGroup.Post("/set-gold-rate", transactionHandler.HandleSetGoldRate)

	// مدیریت عیارها
	purityGroup := transactionGroup.Group("/purity")
	purityGroup.Get("/", transactionHandler.HandleGetPurityList)
	purityGroup.Post("/", transactionHandler.HandleCreatePurity)
	purityGroup.Get("/:id", transactionHandler.HandleGetPurityByID)
	purityGroup.Put("/:id", transactionHandler.HandleUpdatePurity)
	purityGroup.Delete("/:id", transactionHandler.HandleDeletePurity)

	// ----------------------
	// 4. جستجو، فیلتر و داشبورد
	// ----------------------

	// جستجو و فیلتر
	searchGroup := transactionGroup.Group("/search")
	searchGroup.Post("/", transactionHandler.HandleSearchTransactions)
	searchGroup.Post("/filter", transactionHandler.HandleFilterTransactions)

	// چارت و داشبورد (از SellController)
	transactionGroup.Get("/chart/data", transactionHandler.HandleGetTransactionChartData)
	transactionGroup.Get("/dashboard/stats", transactionHandler.HandleGetDashboardStats)

	// ----------------------
	// 5. گزارش‌گیری تخصصی
	// ----------------------

	reportsGroup := transactionGroup.Group("/reports")

	// گزارش‌های زمانی
	reportsGroup.Get("/daily", transactionHandler.HandleDailyReport)
	reportsGroup.Get("/monthly", transactionHandler.HandleMonthlyReport)
	reportsGroup.Get("/yearly", transactionHandler.HandleYearlyReport)

	// گزارش‌های مالی
	reportsGroup.Get("/profit-loss", transactionHandler.HandleProfitLossReport)
	reportsGroup.Get("/cash-flow", transactionHandler.HandleCashFlowReport)

	// گزارش‌های طلا
	reportsGroup.Get("/by-karat", transactionHandler.HandleReportByKarat)
	reportsGroup.Get("/by-purity", transactionHandler.HandleReportByPurity)
	reportsGroup.Get("/inventory", transactionHandler.HandleInventoryReport)

	// گزارش‌های طرف حساب
	reportsGroup.Get("/party/:partyId", transactionHandler.HandlePartyReport)
	reportsGroup.Get("/party/:partyId/ledger", transactionHandler.HandlePartyLedgerReport)

	// ----------------------
	// 6. سند و فاکتور
	// ----------------------

	documentGroup := transactionGroup.Group("/:id")
	documentGroup.Get("/invoice", transactionHandler.HandleGetInvoicePDF)
	documentGroup.Post("/invoice/export", transactionHandler.HandleExportInvoiceToExcel)
	documentGroup.Get("/invoice/html", transactionHandler.HandleGetInvoiceHTML)
	documentGroup.Post("/invoice/print", transactionHandler.HandlePrintInvoice)

	// سند حسابداری
	documentGroup.Get("/accounting-entry", transactionHandler.HandleGetAccountingEntry)
	documentGroup.Post("/accounting-entry/sync", transactionHandler.HandleSyncAccountingEntry)

	// لاگ‌های تراکنش
	documentGroup.Get("/logs", transactionHandler.HandleGetTransactionLogs)

	// ----------------------
	// 7. مانده حساب و بدهی/بستانکاری
	// ----------------------

	balanceGroup := transactionGroup.Group("/balances")
	balanceGroup.Get("/party/:partyId", transactionHandler.HandleGetPartyBalance)
	balanceGroup.Get("/party/:partyId/history", transactionHandler.HandleGetBalanceHistory)
	balanceGroup.Get("/party/:partyId/ledger", transactionHandler.HandleGetPartyLedger)

	// مانده انبار و خزانه
	balanceGroup.Get("/inventory", transactionHandler.HandleGetInventoryBalance)
	balanceGroup.Get("/treasury", transactionHandler.HandleGetTreasuryBalance)

	// ----------------------
	// 8. ارتباط با ماژول‌های دیگر
	// ----------------------

	impactGroup := transactionGroup.Group("/:id")
	impactGroup.Get("/inventory-impact", transactionHandler.HandleGetInventoryImpact)
	impactGroup.Get("/treasury-impact", transactionHandler.HandleGetTreasuryImpact)
	impactGroup.Get("/accounting-impact", transactionHandler.HandleGetAccountingImpact)

	// ----------------------
	// 9. عملیات بچ و bulk
	// ----------------------

	bulkGroup := transactionGroup.Group("/bulk")
	bulkGroup.Post("/import", transactionHandler.HandleBulkImportTransactions)
	bulkGroup.Post("/export", transactionHandler.HandleBulkExportTransactions)
	bulkGroup.Post("/process", transactionHandler.HandleBulkProcessTransactions)

	// ----------------------
	// 10. تنظیمات و پیکربندی
	// ----------------------

	configGroup := transactionGroup.Group("/config")
	configGroup.Get("/gold-rate-settings", transactionHandler.HandleGetGoldRateSettings)
	configGroup.Post("/gold-rate-settings", transactionHandler.HandleUpdateGoldRateSettings)
	configGroup.Get("/transaction-types", transactionHandler.HandleGetTransactionTypes)
	configGroup.Post("/transaction-types", transactionHandler.HandleCreateTransactionType)

	// ----------------------
	// 11. API های خارجی و ادغام
	// ----------------------

	integrationGroup := transactionGroup.Group("/integration")
	integrationGroup.Post("/webhook", transactionHandler.HandleWebhook)
	integrationGroup.Get("/sync-status", transactionHandler.HandleGetSyncStatus)
	integrationGroup.Post("/sync", transactionHandler.HandleManualSync)

	// ----------------------
	// 12. روت‌های مدیریتی (Admin)
	// ----------------------*/

	logger.Info("Transaction routes set up successfully.")

	return nil
}
