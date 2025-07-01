// backend/src/SettingsManager/cmd/main.go
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
	settingsRepo := repository.NewSettingsRepository()
	settingsService := service.NewSettingsService(settingsRepo)
	settingsHandler := handler.NewSettingsHandler(settingsService)

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// A more permissive CORS for development
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:8080", "http://localhost:5173"}, // Allow API Gateway and Vite dev server
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Define API routes under /api prefix
	r.Route("/api", func(r chi.Router) {
		// In a real app, an auth middleware would be used here.
		// For this service, auth is handled by the API Gateway.
		r.Get("/settings", settingsHandler.GetSettings)
		r.Post("/settings", settingsHandler.UpdateSettings)
	})

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("SettingsManager Service is running!"))
	})

	port := "8082" // A dedicated port for this service
	fmt.Printf("SettingsManager server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}