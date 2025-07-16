package postgresDb

import (
	"encoding/json"
	"profile-gold/internal/model" 
	"profile-gold/internal/utils"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

func SeedInitialData(db *gorm.DB) {
	utils.Log.Info("Attempting to seed initial data (roles and permissions)...")

	rolesToSeed := []model.Role{
		{Name: model.RoleAdmin, Description: "System Administrator with full access."},
		{Name: model.RoleOwner, Description: "Business Owner with oversight and key financial access."},
		{Name: model.RoleSalesperson, Description: "Sales representative, manages sales and customer interactions."},
		{Name: model.RoleAccountant, Description: "Manages financial transactions, reports, and accounts."},
	}

	createdRoles := make(map[string]model.Role)

	for _, role := range rolesToSeed {
		var existingRole model.Role
		// Check if role already exists
		result := db.Where("name = ?", role.Name).First(&existingRole)
		if result.Error == gorm.ErrRecordNotFound {
		
			if err := db.Create(&role).Error; err != nil {
				utils.Log.Error("Failed to seed role", zap.String("role_name", role.Name), zap.Error(err))
				continue
			}
			utils.Log.Info("Role seeded successfully", zap.String("role_name", role.Name))
			createdRoles[role.Name] = role
		} else if result.Error != nil {
			utils.Log.Error("Failed to check existing role", zap.String("role_name", role.Name), zap.Error(result.Error))
			continue
		} else {
			utils.Log.Info("Role already exists, skipping seed", zap.String("role_name", role.Name))
			createdRoles[role.Name] = existingRole
		}
	}

	permissionsToSeed := []model.Permission{

		{Name: model.PermInventoryReadItem, Description: "Allows reading item details from inventory."},
		{Name: model.PermInventoryCreateItem, Description: "Allows creating new items in inventory."},
		{Name: model.PermInventoryUpdateItem, Description: "Allows updating existing items in inventory."},
		{Name: model.PermInventoryDeleteItem, Description: "Allows soft-deleting items from inventory."},
		{Name: model.PermInventoryIncreaseStock, Description: "Allows increasing item stock levels."},
		{Name: model.PermInventoryDecreaseStock, Description: "Allows decreasing item stock levels."},
		{Name: model.PermInventoryReadCategory, Description: "Allows reading item categories."},
		{Name: model.PermInventoryManageCategory, Description: "Allows creating, updating, and deleting item categories."},
		{Name: model.PermInventoryReadGoldPrice, Description: "Allows reading current gold prices."},
		{Name: model.PermInventoryUpdateGoldPrice, Description: "Allows manual update of gold prices."},

		{Name: model.PermCRMReadCustomer, Description: "Allows reading customer details."},
		{Name: model.PermCRMCreateCustomer, Description: "Allows creating new customers."},
		{Name: model.PermCRMUpdateCustomer, Description: "Allows updating customer details."},
		{Name: model.PermCRMDeleteCustomer, Description: "Allows soft-deleting customers."},
		{Name: model.PermCRMReadSupplier, Description: "Allows reading supplier details."},
		{Name: model.PermCRMCreateSupplier, Description: "Allows creating new suppliers."},
		{Name: model.PermCRMUpdateSupplier, Description: "Allows updating supplier details."},
		{Name: model.PermCRMDeleteSupplier, Description: "Allows soft-deleting suppliers."},
		{Name: model.PermCRMViewCustomerBalance, Description: "Allows viewing customer account balances."},
		{Name: model.PermCRMViewSupplierBalance, Description: "Allows viewing supplier account balances."},

		{Name: model.PermTransactionReadSaleInvoice, Description: "Allows reading sales invoices."},
		{Name: model.PermTransactionCreateSaleInvoice, Description: "Allows creating new sales invoices."},
		{Name: model.PermTransactionUpdateSaleInvoice, Description: "Allows updating sales invoices."},
		{Name: model.PermTransactionDeleteSaleInvoice, Description: "Allows voiding/deleting sales invoices."},
		{Name: model.PermTransactionReadPurchaseInvoice, Description: "Allows reading purchase invoices."},
		{Name: model.PermTransactionCreatePurchaseInvoice, Description: "Allows creating new purchase invoices."},
		{Name: model.PermTransactionUpdatePurchaseInvoice, Description: "Allows updating purchase invoices."},
		{Name: model.PermTransactionDeletePurchaseInvoice, Description: "Allows voiding/deleting purchase invoices."},
		{Name: model.PermTransactionManagePayments, Description: "Allows managing incoming/outgoing payments."},
		{Name: model.PermTransactionManageExpenses, Description: "Allows managing expenses."},
		{Name: model.PermTransactionManageCheques, Description: "Allows managing cheques."},

		{Name: model.PermReportViewSalesSummary, Description: "Allows viewing sales summary reports."},
		{Name: model.PermReportViewInventorySummary, Description: "Allows viewing inventory summary reports."},
		{Name: model.PermReportViewProfitLoss, Description: "Allows viewing profit and loss reports."},
		{Name: model.PermReportViewBalances, Description: "Allows viewing account balances reports (AR/AP)."},
		{Name: model.PermReportExportData, Description: "Allows exporting report data."},

		{Name: model.PermUserRead, Description: "Allows reading user details."},
		{Name: model.PermUserCreate, Description: "Allows creating new users."},
		{Name: model.PermUserUpdate, Description: "Allows updating user details."},
		{Name: model.PermUserDelete, Description: "Allows soft-deleting users."},
		{Name: model.PermUserChangeAnyPassword, Description: "Allows changing any user's password."},
		{Name: model.PermSystemSettingsRead, Description: "Allows reading system settings."},
		{Name: model.PermSystemSettingsManage, Description: "Allows managing system settings."},
	}

	createdPerms := make(map[string]model.Permission)

	for _, perm := range permissionsToSeed {
		var existingPerm model.Permission
		result := db.Where("name = ?", perm.Name).First(&existingPerm)
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&perm).Error; err != nil {
				utils.Log.Error("Failed to seed permission", zap.String("permission_name", perm.Name), zap.Error(err))
				continue
			}
			utils.Log.Info("Permission seeded successfully", zap.String("permission_name", perm.Name))
			createdPerms[perm.Name] = perm
		} else if result.Error != nil {
			utils.Log.Error("Failed to check existing permission", zap.String("permission_name", perm.Name), zap.Error(result.Error))
			continue
		} else {
			utils.Log.Info("Permission already exists, skipping seed", zap.String("permission_name", perm.Name))
			createdPerms[perm.Name] = existingPerm
		}
	}

	
	rolePermissionMap := map[string][]string{
		model.RoleAdmin: {
			model.PermInventoryReadItem, model.PermInventoryCreateItem, model.PermInventoryUpdateItem, model.PermInventoryDeleteItem,
			model.PermInventoryIncreaseStock, model.PermInventoryDecreaseStock, model.PermInventoryReadCategory, model.PermInventoryManageCategory,
			model.PermInventoryReadGoldPrice, model.PermInventoryUpdateGoldPrice,
			model.PermCRMReadCustomer, model.PermCRMCreateCustomer, model.PermCRMUpdateCustomer, model.PermCRMDeleteCustomer,
			model.PermCRMReadSupplier, model.PermCRMCreateSupplier, model.PermCRMUpdateSupplier, model.PermCRMDeleteSupplier,
			model.PermCRMViewCustomerBalance, model.PermCRMViewSupplierBalance,
			model.PermTransactionReadSaleInvoice, model.PermTransactionCreateSaleInvoice, model.PermTransactionUpdateSaleInvoice, model.PermTransactionDeleteSaleInvoice,
			model.PermTransactionReadPurchaseInvoice, model.PermTransactionCreatePurchaseInvoice, model.PermTransactionUpdatePurchaseInvoice, model.PermTransactionDeletePurchaseInvoice,
			model.PermTransactionManagePayments, model.PermTransactionManageExpenses, model.PermTransactionManageCheques,
			model.PermReportViewSalesSummary, model.PermReportViewInventorySummary, model.PermReportViewProfitLoss, model.PermReportViewBalances, model.PermReportExportData,
			model.PermUserRead, model.PermUserCreate, model.PermUserUpdate, model.PermUserDelete, model.PermUserChangeAnyPassword,
			model.PermSystemSettingsRead, model.PermSystemSettingsManage,
		},
		model.RoleOwner: {
			model.PermInventoryReadItem, model.PermInventoryCreateItem, model.PermInventoryUpdateItem, model.PermInventoryDeleteItem,
			model.PermInventoryIncreaseStock, model.PermInventoryDecreaseStock, model.PermInventoryReadCategory, model.PermInventoryManageCategory,
			model.PermInventoryReadGoldPrice, model.PermInventoryUpdateGoldPrice,
			model.PermCRMReadCustomer, model.PermCRMCreateCustomer, model.PermCRMUpdateCustomer, model.PermCRMDeleteCustomer,
			model.PermCRMReadSupplier, model.PermCRMCreateSupplier, model.PermCRMUpdateSupplier, model.PermCRMDeleteSupplier,
			model.PermCRMViewCustomerBalance, model.PermCRMViewSupplierBalance,
			model.PermTransactionReadSaleInvoice, model.PermTransactionCreateSaleInvoice, model.PermTransactionUpdateSaleInvoice, model.PermTransactionDeleteSaleInvoice,
			model.PermTransactionReadPurchaseInvoice, model.PermTransactionCreatePurchaseInvoice, model.PermTransactionUpdatePurchaseInvoice, model.PermTransactionDeletePurchaseInvoice,
			model.PermTransactionManagePayments, model.PermTransactionManageExpenses, model.PermTransactionManageCheques,
			model.PermReportViewSalesSummary, model.PermReportViewInventorySummary, model.PermReportViewProfitLoss, model.PermReportViewBalances, model.PermReportExportData,
			model.PermUserRead,
			model.PermSystemSettingsRead,
		},
		model.RoleSalesperson: {
			model.PermInventoryReadItem,
			model.PermInventoryReadGoldPrice,
			model.PermCRMReadCustomer,
			model.PermCRMCreateCustomer,
			model.PermCRMUpdateCustomer,
			model.PermTransactionReadSaleInvoice,
			model.PermTransactionCreateSaleInvoice,
			model.PermTransactionManagePayments,
			model.PermReportViewSalesSummary,
			model.PermInventoryDecreaseStock,
		},
		model.RoleAccountant: {
			model.PermInventoryReadItem,
			model.PermInventoryReadGoldPrice,
			model.PermCRMReadCustomer,
			model.PermCRMReadSupplier,
			model.PermCRMViewCustomerBalance,
			model.PermCRMViewSupplierBalance,
			model.PermTransactionReadSaleInvoice, model.PermTransactionUpdateSaleInvoice, model.PermTransactionDeleteSaleInvoice,
			model.PermTransactionReadPurchaseInvoice, model.PermTransactionCreatePurchaseInvoice, model.PermTransactionUpdatePurchaseInvoice, model.PermTransactionDeletePurchaseInvoice,
			model.PermTransactionManagePayments, model.PermTransactionManageExpenses, model.PermTransactionManageCheques,
			model.PermReportViewSalesSummary, model.PermReportViewInventorySummary, model.PermReportViewProfitLoss, model.PermReportViewBalances, model.PermReportExportData,
		},
	}

	for roleName, permNames := range rolePermissionMap {
		role, roleExists := createdRoles[roleName]
		if !roleExists {
			utils.Log.Error("Role not found in seeded roles, cannot map permissions", zap.String("role_name", roleName))
			continue
		}

		for _, permName := range permNames {
			permission, permExists := createdPerms[permName]
			if !permExists {
				utils.Log.Warn("Permission not found in seeded permissions, skipping mapping", zap.String("permission_name", permName))
				continue
			}

			var existingMapping model.RolePermission

			result := db.Where("role_id = ? AND permission_id = ?", role.ID, permission.ID).First(&existingMapping)
			if result.Error == gorm.ErrRecordNotFound {

				if err := db.Create(&model.RolePermission{RoleID: role.ID, PermissionID: permission.ID}).Error; err != nil {
					utils.Log.Error("Failed to seed role-permission mapping",
						zap.String("role", role.Name), zap.String("permission", permission.Name), zap.Error(err))
				} else {
					utils.Log.Info("Role-permission mapping seeded successfully",
						zap.String("role", role.Name), zap.String("permission", permission.Name))
				}
			} else if result.Error != nil {
				utils.Log.Error("Failed to check existing role-permission mapping",
					zap.String("role", role.Name), zap.String("permission", permission.Name), zap.Error(result.Error))
			} else {
				utils.Log.Debug("Role-permission mapping already exists, skipping seed",
					zap.String("role", role.Name), zap.String("permission", permission.Name))
			}
		}
	}
	utils.Log.Info("Initial data seeding completed.")

	
	var adminUser model.User
	result := db.Where("username = ?", "admin").First(&adminUser)
	if result.Error == gorm.ErrRecordNotFound {
		hashedPassword, _ := utils.HashPassword("adminpassword") 
		adminRolesJSON, _ := json.Marshal([]string{model.RoleAdmin})

		admin := model.User{
			Username:     "admin",
			PasswordHash: hashedPassword,
			Email:        "admin@example.com",
			Roles:        adminRolesJSON,
		}
		if err := db.Create(&admin).Error; err != nil {
			utils.Log.Error("Failed to seed default admin user", zap.Error(err))
		} else {
			utils.Log.Info("Default admin user seeded successfully.")
		}
	} else if result.Error != nil {
		utils.Log.Error("Failed to check existing admin user", zap.Error(result.Error))
	} else {
		utils.Log.Info("Default admin user already exists, skipping seed.")
	}
}
