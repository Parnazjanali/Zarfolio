package server

import (
	"profile-gold/internal/api/handler"

	"github.com/gofiber/fiber/v2"
)

func SetUpRoutes(app *fiber.App, profileHandler *handler.ProfileHandler, authHandler *handler.AuthHandler) error {

	/*authApiGroup := app.Group("/")
	authApiGroup.Post("/register", authHanchandler.Register)
	authApiGroup.Post("/login", authHanchandler.Login)
	authApiGroup.Post("/logout", authHanchandler.Logout)

	profileApiGroup := app.Group("/profile")
	profileApiGroup.Post("/", profileHandler.CreateProfile)
	profileApiGroup.Get("/:id", profileHandler.GetProfile)
	profileApiGroup.Put("/:id", profileHandler.UpdateProfile)
	profileApiGroup.Delete("/:id", profileHandler.DeleteProfile)*/

	return nil

}
