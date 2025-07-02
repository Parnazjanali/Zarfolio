// backend/src/SettingsManager/cmd/main.go
package main

import (
	"fmt"
	"log"
	"net/http"
	"zarfolio-backend/settings-manager/internal/db"
	"zarfolio-backend/settings-manager/internal/handler"
	"zarfolio-backend/settings-manager/internal/repository"
	"zarfolio-backend/settings-manager/internal/service"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv" // <--- این خط را اضافه کنید
)

func main() {
    // --- شروع تغییرات ---
	// بارگذاری متغیرهای محیطی از فایل .env در ریشه پوشه backend
	// مسیر ../../../.env از پوشه cmd به ریشه backend اشاره دارد.
	err := godotenv.Load("../.env")
	if err != nil {
		log.Printf("Warning: Could not load .env file from parent directory. Assuming environment variables are set. Error: %v", err)
	}
    // --- پایان تغییرات ---

	// Initialize database connection
	database, err := db.InitDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// ... (بقیه کد بدون تغییر باقی می‌ماند)

	settingsRepo := repository.NewPostgresSettingsRepository(database)
	settingsService := service.NewSettingsService(settingsRepo)
	settingsHandler := handler.NewSettingsHandler(settingsService)

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:8080", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Get("/settings", settingsHandler.GetSettings)
		r.Post("/settings", settingsHandler.UpdateSettings)
	})

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("SettingsManager Service is running!"))
	})

	port := "8082"
	fmt.Printf("SettingsManager server starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}