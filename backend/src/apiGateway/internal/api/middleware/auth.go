package middleware

import (
	"encoding/json"
	"log"
	"strings"

	"gold-api/internal/authz"
	"gold-api/internal/model"
	"gold-api/internal/utils"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)


type AuthMiddleware struct {
	permissionService *authz.PermissionService 
	logger            *zap.Logger
}


func NewAuthMiddleware(ps *authz.PermissionService, logger *zap.Logger) *AuthMiddleware {
	if ps == nil {
		logger.Fatal("PermissionService cannot be nil for AuthMiddleware.")
	}
	if logger == nil {
		log.Fatal("Logger cannot be nil for AuthMiddleware.") 
	}
	return &AuthMiddleware{
		permissionService: ps,
		logger:            logger,
	}
}

func (m *AuthMiddleware) AuthorizeMiddleware(requiredPermission string) fiber.Handler {
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

		claims, err := utils.ValidateToken(tokenString) 
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

		if !m.permissionService.HasPermission(userRoles, requiredPermission) {
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
