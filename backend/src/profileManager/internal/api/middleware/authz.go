package middleware

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"profile-gold/internal/api/authz"
	"profile-gold/internal/model"
	"profile-gold/internal/utils"
)

type AuthZMiddleware struct {
	logger            *zap.Logger
	permissionService authz.PermissionService
	jwtValidator      utils.JWTValidator
}

func (m *AuthZMiddleware) AuthorizeMiddleware(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			m.logger.Warn("Authorization header missing for protected route",
				zap.String("path", c.OriginalURL()), zap.String("required_perm", requiredPermission))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Authorization header missing."})
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		if tokenString == "" {
			m.logger.Warn("Bearer token missing for protected route",
				zap.String("path", c.OriginalURL()), zap.String("required_perm", requiredPermission))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Bearer token missing."})
		}

		claims, err := m.jwtValidator.ValidateToken(tokenString)
		if err != nil {
			m.logger.Error("Invalid or expired token for protected route",
				zap.Error(err), zap.String("path", c.OriginalURL()), zap.String("required_perm", requiredPermission))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Invalid or expired token", Details: err.Error()})
		}

		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)

		var userRoles []string
		if err := json.Unmarshal(claims.Roles, &userRoles); err != nil {
			m.logger.Error("Failed to unmarshal user roles from JWT claims",
				zap.String("userID", claims.UserID), zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error: role parsing failed."})
		}
		c.Locals("userRoles", userRoles)

		if !m.permissionService.HashPermission(userRoles, requiredPermission) {
			m.logger.Warn("Access denied: User does not have required permission",
				zap.String("userID", claims.UserID),
				zap.Strings("user_roles", userRoles),
				zap.String("required_permission", requiredPermission),
				zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{Message: "Access denied: Insufficient permissions."})
		}

		return c.Next()
	}
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
func (m *AuthZMiddleware) VerifyServiceToken() fiber.Handler {
	return func(c *fiber.Ctx) error {

		expectedSecret := os.Getenv("PROFILE_MANAGER_SERVICE_SECRET")
		if expectedSecret == "" {
			m.logger.Fatal("PROFILE_MANAGER_SERVICE_SECRET not set for VerifyServiceToken middleware.")
		}

		serviceSecret := c.Get("X-Service-Secret")
		if serviceSecret == "" {
			m.logger.Warn("Profile Manager: X-Service-Secret header missing for internal route", zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Service secret header missing.",
				Code:    "401",
			})
		}

		if serviceSecret != expectedSecret {
			m.logger.Warn("Profile Manager: Invalid service secret received", zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{
				Message: "Forbidden: Invalid service secret.",
				Code:    "403",
			})
		}

		m.logger.Debug("Profile Manager: Service token verified successfully.", zap.String("path", c.OriginalURL()))
		return c.Next()
	}
}

func (m *AuthZMiddleware) AuthorizePermission(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRoles, ok := c.Locals("userRoles").([]string)
		if !ok {
			m.logger.Error("Profile Manager: User roles not found in context for authorization check.")
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error: User roles not available."})
		}

		if !m.permissionService.HashPermission(userRoles, requiredPermission) {
			m.logger.Warn("Profile Manager: Access denied: User does not have required permission for internal operation",
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
