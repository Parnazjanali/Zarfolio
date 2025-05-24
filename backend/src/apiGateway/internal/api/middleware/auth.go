package middleware

import "github.com/gofiber/fiber/v2"

func AuthUser(c *fiber.Ctx) error {

	return c.Next()
}
