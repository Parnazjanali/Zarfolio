package service

import (
	"strings"

	"gold-api/internal/model" // Make sure this path is correct for apiGateway's model package

	"go.uber.org/zap"
)

// PermissionService defines methods for managing permissions.
// In API Gateway, it's used for RBAC checks based on roles from JWT claims.
type PermissionService struct {
	logger *zap.Logger
}

// NewPermissionService creates a new instance of PermissionService for API Gateway.
// It uses a hardcoded map for role-permission mapping, suitable for API Gateway's authorization checks.
func NewPermissionService(logger *zap.Logger) *PermissionService {
	if logger == nil {
		// Fallback to a basic logger if zap.Logger is not provided at init
		// In a real app, ensure zap.Logger is always initialized properly.
		// log.Fatal("Logger cannot be nil for PermissionService in API Gateway.")
	}
	return &PermissionService{logger: logger}
}

// hardcodedRolePermissionsMap stores the mapping from Role to a slice of Permissions.
// This map MUST be kept in sync with the mapping defined in profileManager/internal/service/permission_service.go
// as both services need consistent permission logic.
var hardcodedRolePermissionsMap = map[string][]string{
	model.RoleAdmin: {
		// Admin has comprehensive access (listing all permissions explicitly for clarity)
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

// GetPermissionsForRoles calculates and returns all unique permissions for a given set of roles.
func (s *PermissionService) GetPermissionsForRoles(roles []string) []string {
	uniquePerms := make(map[string]struct{})
	for _, role := range roles {
		if perms, ok := hardcodedRolePermissionsMap[role]; ok {
			for _, perm := range perms {
				uniquePerms[perm] = struct{}{}
			}
		}
	}

	var permsList []string
	for perm := range uniquePerms {
		permsList = append(permsList, perm)
	}
	return permsList
}

// HasPermission checks if a user with given roles has the required permission.
func (s *PermissionService) HasPermission(roles []string, requiredPermission string) bool {
	// Check for "admin" role directly for full access
	for _, role := range roles {
		if role == model.RoleAdmin {
			return true // Admin has all permissions
		}
	}

	userPermissions := s.GetPermissionsForRoles(roles)
	for _, perm := range userPermissions {
		if perm == requiredPermission {
			return true
		}
		// Basic wildcard matching (e.g., if user has "inventory:*", they have "inventory:read_item")
		if strings.HasSuffix(perm, ":*") { // Checks for "resource:*" pattern
			resourcePrefix := strings.TrimSuffix(perm, ":*")
			if strings.HasPrefix(requiredPermission, resourcePrefix+":") {
				return true
			}
		}
	}
	return false
}
