package middleware

import (
	"encoding/json" // For unmarshaling datatypes.JSON from roles
	"log"
	"strings"

	"gold-api/internal/model"   // Import your models (User, CustomClaims, ErrorResponse, Role/Perm constants)
	"gold-api/internal/service" // Import your PermissionService
	"gold-api/internal/utils"   // Import your JWT utility (e.g., ValidateToken)

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type AuthMiddleware struct {
	permissionService *service.PermissionService // Dependency for checking permissions
	logger            *zap.Logger
}

// NewAuthMiddleware creates a new instance of AuthMiddleware.
// It requires a PermissionService to perform authorization checks.
func NewAuthMiddleware(ps *service.PermissionService, logger *zap.Logger) *AuthMiddleware {
	if ps == nil {
		logger.Fatal("PermissionService cannot be nil for AuthMiddleware.")
	}
	if logger == nil {
		log.Fatal("Logger cannot be nil for AuthMiddleware.") // Using standard log if zap is nil before it initializes
	}
	return &AuthMiddleware{
		permissionService: ps,
		logger:            logger,
	}
}

// AuthorizeMiddleware is the main middleware function for JWT validation and RBAC.
// It returns a Fiber handler that checks for a valid token and required permission.
// The `requiredPermission` parameter specifies the permission string needed for the route (e.g., "inventory:create_item").
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

		// Validate token and get claims using the JWT utility from profileManager's utils
		claims, err := utils.ValidateToken(tokenString) // Make sure utils.ValidateToken returns *model.CustomClaims
		if err != nil {
			m.logger.Error("Invalid or expired token for protected route",
				zap.Error(err), zap.String("path", c.OriginalURL()), zap.String("required_perm", requiredPermission))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{Message: "Invalid or expired token", Details: err.Error()})
		}

		// Store user info and roles in Fiber context for downstream handlers/logging
		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		// Unmarshal roles from datatypes.JSON to []string for easier use in permission checks
		var userRoles []string
		if err := json.Unmarshal(claims.Roles, &userRoles); err != nil {
			m.logger.Error("Failed to unmarshal user roles from JWT claims",
				zap.String("userID", claims.UserID), zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{Message: "Internal server error: role parsing failed."})
		}
		c.Locals("userRoles", userRoles) // Store as []string

		// --- RBAC (Role-Based Access Control) Check ---
		// Use the injected PermissionService to check if the user has the required permission.
		if !m.permissionService.HasPermission(userRoles, requiredPermission) {
			m.logger.Warn("Access denied: User does not have required permission",
				zap.String("userID", claims.UserID),
				zap.Strings("user_roles", userRoles), // Log actual string roles
				zap.String("required_permission", requiredPermission),
				zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{Message: "Access denied: Insufficient permissions."})
		}

		// User has permission, proceed to the next handler
		return c.Next()
	}
}
