package authz

import (
    "strings"

    "gold-api/internal/model" 
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
        // ... (Permissions for Owner)
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
    GetPermissionsForRoles(roles []string) []string
    HasPermission(roles []string, requiredPermission string) bool
}

type PermissionServiceImpl struct {
    logger *zap.Logger
}

func NewPermissionService(logger *zap.Logger) PermissionService { // <-- Returns the interface, not the struct pointer
    if logger == nil {
        panic("Logger cannot be nil for PermissionService.")
    }
    return &PermissionServiceImpl{logger: logger}
}

func (s *PermissionServiceImpl) GetPermissionsForRoles(roles []string) []string {
    uniquePerms := make(map[string]struct{})
    for _, role := range roles {
        if perms, ok := rolePermissionsMap[role]; ok {
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

func (s *PermissionServiceImpl) HasPermission(roles []string, requiredPermission string) bool {
    for _, role := range roles {
        if role == model.RoleAdmin {
            return true
        }
    }

    userPermissions := s.GetPermissionsForRoles(roles)
    for _, perm := range userPermissions {
        if perm == requiredPermission {
            return true
        }
        if strings.HasSuffix(perm, ":*") {
            resourcePrefix := strings.TrimSuffix(perm, ":*")
            if strings.HasPrefix(requiredPermission, resourcePrefix+":") {
                return true
            }
        }
    }
    return false
}