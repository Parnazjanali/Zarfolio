package routes

import (
	"gold-api/internal/api/handler"
	"gold-api/internal/api/middleware"
	"log"

	"github.com/gofiber/fiber/v2"
)

func SetUpRoutes(){
	app:= fiber.New()

	app.Use(middleware.CorsMiddleware())

	apiGroup:= app.Group("/api/v1")

	registerGroup:= apiGroup.Group("/register")
	registerGroup.Post("/user", handler.RegisterUser)

	authGroup:= apiGroup.Group("/auth")
	authGroup.Post("/login", middleware.authUser ,handler.LoginUser)

	port:="127.0.0.1:8080"

	log.Fatal(app.Listen(port))

}