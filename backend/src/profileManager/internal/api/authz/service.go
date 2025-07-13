package authz

import (
	"fmt"
	"profile-gold/internal/model"

	"go.uber.org/zap"
)

var rolePermissionsMap = map[string][]string{
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

type PermissionService interface {
	HashPermission(userRoles []string, requiredPermission string) bool
	IsValidRole(role string) bool
	
}

type permissionServiceImpl struct {
	logger *zap.Logger
	validRoles      map[string]bool
	rolePermissions map[string][]string 
}

func NewPermissionService(logger *zap.Logger) (PermissionService, error) { 
	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for PermissionService")
	}

	validRoles := map[string]bool{
		"admin": true,
		"user":  true,
		"guest": true,
	}
	rolePermissions := map[string][]string{
		"admin": {"PermUserRead", "PermUserCreate", "PermUserUpdate", "PermUserDelete", "PermUserChangeAnyPassword"},
		"user":  {"PermUserRead"},
		"guest": {},
	}

	return &permissionServiceImpl{
		logger:          logger,
		validRoles:      validRoles,
		rolePermissions: rolePermissions,
	}, nil
}

func (s *permissionServiceImpl) IsValidRole(role string) bool {
	_, ok := s.validRoles[role]
	return ok
}

func (s *permissionServiceImpl) HashPermission(userRoles []string, requiredPermission string) bool {
	for _, userRole := range userRoles {
		if perms, ok := s.rolePermissions[userRole]; ok {
			for _, perm := range perms {
				if perm == requiredPermission {
					return true
				}
			}
		}
	}
	return false
}
