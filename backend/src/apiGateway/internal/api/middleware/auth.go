package middleware

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"

	"gold-api/internal/api/authz"
	"gold-api/internal/model"
	"gold-api/internal/utils"
)

type AuthMiddleware struct {
	permissionService authz.PermissionService
	jwtValidator      utils.JWTValidator
	logger            *zap.Logger
}

func NewAuthMiddleware(permService authz.PermissionService, logger *zap.Logger, jwtValidator utils.JWTValidator) (*AuthMiddleware, error) {
	if permService == nil {
		return nil, fmt.Errorf("permissionService cannot be nil for AuthMiddleware")
	}
	if logger == nil {
		return nil, fmt.Errorf("logger cannot be nil for AuthMiddleware")
	}
	if jwtValidator == nil {
		return nil, fmt.Errorf("JWTValidator cannot be nil for AuthMiddleware")
	}

	return &AuthMiddleware{
		permissionService: permService,
		jwtValidator:      jwtValidator,
		logger:            logger,
	}, nil
}
func (m *AuthMiddleware) AuthorizeMiddleware(requiredPermissions ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusNoContent) 
		}

		authHeader := c.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			m.logger.Warn("Invalid or missing Authorization header",
				zap.String("path", c.OriginalURL()),
				zap.Strings("required_perms", requiredPermissions))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Missing or invalid Authorization header.",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := m.jwtValidator.ValidateToken(tokenString)
		if err != nil {
			m.logger.Warn("Invalid or expired token",
				zap.Error(err),
				zap.String("path", c.OriginalURL()),
				zap.Strings("required_perms", requiredPermissions))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Invalid or expired token.",
			})
		}

		c.Locals("userToken", tokenString)
		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)

		var userRoles []string
		if len(claims.Roles) > 0 {
			_ = json.Unmarshal(claims.Roles, &userRoles) 
		}
		c.Locals("userRoles", userRoles)

		for _, perm := range requiredPermissions {
			if m.permissionService.HasPermission(userRoles, perm) {
				m.logger.Debug("Permission granted",
					zap.String("userID", claims.UserID),
					zap.Strings("user_roles", userRoles),
					zap.Strings("required_permissions", requiredPermissions))
				return c.Next() 
			}
		}

		m.logger.Warn("Access denied: insufficient permissions",
			zap.String("userID", claims.UserID),
			zap.Strings("user_roles", userRoles),
			zap.Strings("required_permissions", requiredPermissions))
		return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{
			Message: "Access denied: insufficient permissions.",
		})
	}
}

/*func (m *AuthMiddleware) VerifyServiceToken() fiber.Handler {
	return func(c *fiber.Ctx) error {
		internalJWTString := c.Get("X-Internal-JWT")
		if internalJWTString == "" {
			m.logger.Warn("Internal JWT header missing for internal route", zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Internal service token missing."})
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

		m.logger.Debug("Internal service token verified successfully. User context loaded.",
			zap.String("path", c.OriginalURL()), zap.String("userID", claims.UserID))
		return c.Next()
	}
}
*/
