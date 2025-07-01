// backend/src/SettingsManager/internal/handler/settings_handler.go
package handler

import (
	"encoding/json"
	"net/http"
	"zarfolio-backend/settings-manager/internal/model"
	"zarfolio-backend/settings-manager/internal/service"
)

type SettingsHandler struct {
	service *service.SettingsService
}

func NewSettingsHandler(s *service.SettingsService) *SettingsHandler {
	return &SettingsHandler{service: s}
}

// GetSettings handles GET /api/settings
func (h *SettingsHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.service.GetSettings()
	if err != nil {
		http.Error(w, "Could not retrieve settings: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

// UpdateSettings handles POST /api/settings
func (h *SettingsHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var settings model.SystemSettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updatedSettings, err := h.service.UpdateSettings(&settings)
	if err != nil {
		http.Error(w, "Failed to update settings: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedSettings)
}