package middleware

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"crm-gold/internal/api/authz" 
	"crm-gold/internal/model"    
	"crm-gold/internal/utils"    
)

type AuthZMiddleware struct {
	logger            *zap.Logger
	permissionService authz.PermissionService 
	jwtValidator      utils.JWTValidator      
}

func NewAuthZMiddleware(permService authz.PermissionService, logger *zap.Logger, jwtValidator utils.JWTValidator) (*AuthZMiddleware, error) {
	if permService == nil {
		return nil, fmt.Errorf("permissionService cannot be nil for AuthZMiddleware")
	}
	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for AuthZMiddleware")
	}
	if jwtValidator == nil { 
		return nil, fmt.Errorf("JWTValidator cannot be nil for AuthZMiddleware")
	}

	return &AuthZMiddleware{
		permissionService: permService,
		logger:            logger,
		jwtValidator:      jwtValidator,
	}, nil
}

func (m *AuthZMiddleware) VerifyUserJWT(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			m.logger.Warn("Authorization header missing for protected route", zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Authorization header missing."})
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		if tokenString == "" {
			m.logger.Warn("Bearer token missing for protected route", zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Bearer token missing."})
		}

		claims, err := m.jwtValidator.ValidateToken(tokenString)
		if err != nil {
			m.logger.Error("Invalid or expired user token for protected route", zap.Error(err), zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Invalid or expired token", Details: err.Error()})
		}

		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		var userRoles []string
		if err := json.Unmarshal(claims.Roles, &userRoles); err != nil {
			m.logger.Error("Failed to unmarshal user roles from JWT claims", zap.String("userID", claims.UserID), zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error: role parsing failed."})
		}
		c.Locals("userRoles", userRoles)

		if !m.permissionService.HashPermission(userRoles, requiredPermission) {
			m.logger.Warn("Access denied in API Gateway: User does not have required permission",
				zap.String("userID", claims.UserID), zap.Strings("user_roles", userRoles),
				zap.String("required_permission", requiredPermission), zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{Message: "Access denied: Insufficient permissions."})
		}

		return c.Next()
	}
}

func (m *AuthZMiddleware) VerifyServiceToken() fiber.Handler {
	return func(c *fiber.Ctx) error {
		internalJWTString := c.Get("X-Internal-JWT") // نام هدر توافقی
		if internalJWTString == "" {
			m.logger.Warn("CRM Manager: X-Internal-JWT header missing for internal route", zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Internal service token missing.",
				Code:    "401",
			})
		}

		claims, err := m.jwtValidator.ValidateToken(internalJWTString)
		if err != nil {
			m.logger.Error("Invalid or expired internal service token", zap.Error(err), zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Invalid or expired internal token", Details: err.Error()})
		}

		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		var userRoles []string
		if err := json.Unmarshal(claims.Roles, &userRoles); err != nil {
			m.logger.Error("Failed to unmarshal user roles from internal JWT claims",
				zap.String("userID", claims.UserID), zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error: role parsing from internal token failed."})
		}
		c.Locals("userRoles", userRoles)

		m.logger.Debug("CRM Manager: Internal service token verified successfully. User context loaded.",
			zap.String("path", c.OriginalURL()), zap.String("userID", claims.UserID))
		return c.Next()
	}
}


func (m *AuthZMiddleware) AuthorizePermission(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRoles, ok := c.Locals("userRoles").([]string)
		if !ok {
			m.logger.Error("CRM Manager: User roles not found in context for authorization check (missing X-Internal-JWT processing).")
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error: User roles not available for permission check."})
		}

		if !m.permissionService.HashPermission(userRoles, requiredPermission) {
			m.logger.Warn("CRM Manager: Access denied: User does not have required permission for internal operation",
				zap.String("userID", c.Locals("userID").(string)),
				zap.Strings("user_roles", userRoles),
				zap.String("required_permission", requiredPermission),
				zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{
				Message: "Forbidden: Insufficient permissions for this operation.",
				Code:    "403",
			})
		}
		return c.Next()
	}
}