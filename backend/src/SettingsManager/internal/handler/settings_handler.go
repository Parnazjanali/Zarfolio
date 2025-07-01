// settings-manager/internal/handler/settings_handler.go

package handler

import (
	"encoding/json"
	"net/http"
	"zarfolio-backend/settings-manager/internal/model"
	"zarfolio-backend/settings-manager/internal/service"
)

// SettingsHandler handles HTTP requests related to settings.
type SettingsHandler struct {
	service *service.SettingsService
}

// NewSettingsHandler creates a new handler instance.
func NewSettingsHandler(s *service.SettingsService) *SettingsHandler {
	return &SettingsHandler{service: s}
}

// GetBusinessInfo handles the GET /api/settings/business request.
func (h *SettingsHandler) GetBusinessInfo(w http.ResponseWriter, r *http.Request) {
	info, err := h.service.GetBusinessInfo()
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

// UpdateBusinessInfo handles the POST /api/settings/business request.
func (h *SettingsHandler) UpdateBusinessInfo(w http.ResponseWriter, r *http.Request) {
	var info model.BusinessInfo
	if err := json.NewDecoder(r.Body).Decode(&info); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation can be added here, or kept in the service layer.
	
	err := h.service.UpdateBusinessInfo(&info)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(info)
}