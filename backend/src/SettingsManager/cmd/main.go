// settings-manager/cmd/main.go

package main

import (
	"fmt"
	"log"
	"net/http"
	"zarfolio-backend/settings-manager/internal/handler"
	"zarfolio-backend/settings-manager/internal/repository"
	"zarfolio-backend/settings-manager/internal/service"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// 1. Initialize dependencies (Repository -> Service -> Handler)
	settingsRepo := repository.NewSettingsRepository()
	settingsService := service.NewSettingsService(settingsRepo)
	settingsHandler := handler.NewSettingsHandler(settingsService)

	// 2. Create a new Chi router
	r := chi.NewRouter()

	// 3. Add middlewares
	r.Use(middleware.Logger)    // Log requests
	r.Use(middleware.Recoverer) // Recover from panics

	// Setup CORS (Cross-Origin Resource Sharing)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"}, // Your frontend URL
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// 4. Define API routes
	r.Route("/api", func(r chi.Router) {
        // In a real app, you would have an auth middleware here
		// r.Use(myAuthMiddleware)

		r.Get("/settings/business", settingsHandler.GetBusinessInfo)
		r.Post("/settings/business", settingsHandler.UpdateBusinessInfo)
	})
	
	// A simple health check endpoint
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("SettingsManager Service is running!"))
	})


	// 5. Start the server
	port := "8081" // Use a different port than your other services
	fmt.Printf("SettingsManager server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}