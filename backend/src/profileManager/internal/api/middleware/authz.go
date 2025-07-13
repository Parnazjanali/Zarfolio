package middleware

import (
	"encoding/json"
	"fmt"
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

func (m *AuthZMiddleware) VerifyInternalToken() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			m.logger.Warn("Profile Manager: Authorization header missing for protected route", zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Authorization header missing.",
				Code:    "401",
			})
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		if tokenString == "" {
			m.logger.Warn("Profile Manager: Bearer token missing in Authorization header", zap.String("path", c.OriginalURL()))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Bearer token missing.",
				Code:    "401",
			})
		}

		claims, err := m.jwtValidator.ValidateToken(tokenString)
		if err != nil {
			m.logger.Error("Profile Manager: Invalid or expired JWT token received",
				zap.Error(err), zap.String("path", c.OriginalURL()),
				zap.String("token_prefix", tokenString[:utils.Min(len(tokenString), 30)]+"..."))
			return c.Status(fiber.StatusUnauthorized).JSON(model.ErrorResponse{
				Message: "Unauthorized: Invalid or expired token.",
				Code:    "401",
				Details: err.Error(),
			})
		}

		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)
		var userRoles []string
		if err := json.Unmarshal(claims.Roles, &userRoles); err != nil {
			m.logger.Error("Profile Manager: Failed to unmarshal user roles from JWT claims",
				zap.String("userID", claims.UserID), zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(model.ErrorResponse{
				Message: "Internal server error: Failed to parse user roles.",
				Code:    "500",
			})
		}
		c.Locals("userRoles", userRoles)

		m.logger.Debug("Profile Manager: User authenticated via JWT",
			zap.String("userID", claims.UserID),
			zap.String("username", claims.Username),
			zap.Strings("roles", userRoles))

		requestedUserID := c.Params("id")
		if requestedUserID != "" && requestedUserID != claims.UserID {

			if !m.permissionService.HashPermission(userRoles, model.PermUserChangeAnyPassword) &&
				!m.permissionService.HashPermission(userRoles, model.PermUserUpdate) {

				m.logger.Warn("Profile Manager: Access denied to other user's profile",
					zap.String("requester_userID", claims.UserID),
					zap.String("target_userID", requestedUserID),
					zap.Strings("requester_roles", userRoles))
				return c.Status(fiber.StatusForbidden).JSON(model.ErrorResponse{
					Message: "Forbidden: Cannot access another user's profile without proper permissions.",
					Code:    "403",
				})
			}
		}

		return c.Next()
	}
}

// AuthorizePermission (اختیاری): یک متد جداگانه برای چک کردن مجوزهای خاص در Profile Manager
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
