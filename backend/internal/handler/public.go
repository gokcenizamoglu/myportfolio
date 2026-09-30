package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gokceguler/portfolio/backend/internal/store"
)

type PublicHandler struct{ store *store.Store }

func NewPublicHandler(s *store.Store) *PublicHandler { return &PublicHandler{store: s} }

func (h *PublicHandler) Portfolio(w http.ResponseWriter, _ *http.Request) {
	response := map[string]any{}
	for kind := range store.AllowedKinds {
		items, err := h.store.ListContent(kind, true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "could not load portfolio")
			return
		}
		output := make([]map[string]any, 0, len(items))
		for _, item := range items {
			var data map[string]any
			if err := json.Unmarshal([]byte(item.Data), &data); err != nil {
				continue
			}
			// Older project records predate the explicit featured flag. Keep the
			// first five in the primary grid until an admin makes a deliberate
			// selection; newer records always persist the field explicitly.
			if kind == "projects" {
				if _, exists := data["featured"]; !exists {
					data["featured"] = item.SortOrder <= 5
				}
			}
			data["id"], data["slug"], data["sort_order"], data["visible"] = item.ID, item.Slug, item.SortOrder, item.Visible
			output = append(output, data)
		}
		response[kind] = output
	}
	settings, err := h.store.AllSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load settings")
		return
	}
	response["settings"] = settings
	writeJSON(w, http.StatusOK, response)
}

func (h *PublicHandler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
