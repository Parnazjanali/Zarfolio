package model

const (
	RoleAdmin       = "admin"
	RoleOwner       = "owner"
	RoleSalesperson = "salesperson"
	RoleAccountant  = "accountant"
)

const (
	PermInventoryReadItem        = "inventory:read_item"
	PermInventoryCreateItem      = "inventory:create_item"
	PermInventoryUpdateItem      = "inventory:update_item"
	PermInventoryDeleteItem      = "inventory:delete_item"
	PermInventoryIncreaseStock   = "inventory:increase_stock"
	PermInventoryDecreaseStock   = "inventory:decrease_stock"
	PermInventoryReadCategory    = "inventory:read_category"
	PermInventoryManageCategory  = "inventory:manage_category"
	PermInventoryReadGoldPrice   = "inventory:read_gold_price"
	PermInventoryUpdateGoldPrice = "inventory:update_gold_price"

	PermCRMReadCustomer        = "crm:read_customer"
	PermCRMCreateCustomer      = "crm:create_customer"
	PermCRMUpdateCustomer      = "crm:update_customer"
	PermCRMDeleteCustomer      = "crm:delete_customer"
	PermCRMReadSupplier        = "crm:read_supplier"
	PermCRMCreateSupplier      = "crm:create_supplier"
	PermCRMUpdateSupplier      = "crm:update_supplier"
	PermCRMDeleteSupplier      = "crm:delete_supplier"
	PermCRMViewCustomerBalance = "crm:view_customer_balance"
	PermCRMViewSupplierBalance = "crm:view_supplier_balance"

	PermTransactionReadSaleInvoice       = "transaction:read_sale_invoice"
	PermTransactionCreateSaleInvoice     = "transaction:create_sale_invoice"
	PermTransactionUpdateSaleInvoice     = "transaction:update_sale_invoice"
	PermTransactionDeleteSaleInvoice     = "transaction:delete_sale_invoice"
	PermTransactionReadPurchaseInvoice   = "transaction:read_purchase_invoice"
	PermTransactionCreatePurchaseInvoice = "transaction:create_purchase_invoice"
	PermTransactionUpdatePurchaseInvoice = "transaction:update_purchase_invoice"
	PermTransactionDeletePurchaseInvoice = "transaction:delete_purchase_invoice"
	PermTransactionManagePayments        = "transaction:manage_payments"
	PermTransactionManageExpenses        = "transaction:manage_expenses"
	PermTransactionManageCheques         = "transaction:manage_cheques"

	PermReportViewSalesSummary     = "report:view_sales_summary"
	PermReportViewInventorySummary = "report:view_inventory_summary"
	PermReportViewProfitLoss       = "report:view_profit_loss"
	PermReportViewBalances         = "report:view_balances"
	PermReportExportData           = "report:export_data"
	PermReportImportData		   = "report:import_data"

	PermUserRead              = "user:read"
	PermUserCreate            = "user:create"
	PermUserUpdate            = "user:update"
	PermUserDelete            = "user:delete"
	PermUserChangeAnyPassword = "user:change_any_password"
	PermSystemSettingsRead    = "system:settings_read"
	PermSystemSettingsManage  = "system:settings_manage"
)
