package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gokceguler/portfolio/backend/internal/health"
	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/gokceguler/portfolio/backend/internal/store"
)

type ContentHealthHandler struct {
	store   *store.Store
	checker health.LinkChecker
}

func NewContentHealthHandler(s *store.Store, checker health.LinkChecker) *ContentHealthHandler {
	return &ContentHealthHandler{store: s, checker: checker}
}

func (h *ContentHealthHandler) Report(w http.ResponseWriter, _ *http.Request) {
	items, err := h.store.AllContent()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load content health")
		return
	}
	settings, err := h.store.AllSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load content health")
		return
	}
	writeJSON(w, http.StatusOK, health.Evaluate(items, settings, h.checker))
}

func (h *ContentHealthHandler) CheckItem(w http.ResponseWriter, r *http.Request) {
	kind := chi.URLParam(r, "kind")
	if !store.AllowedKinds[kind] {
		writeError(w, http.StatusNotFound, "unknown content type")
		return
	}
	var request struct {
		ID      int64          `json:"id"`
		Slug    string         `json:"slug"`
		Data    map[string]any `json:"data"`
		Visible bool           `json:"visible"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20)).Decode(&request) != nil || request.Data == nil {
		writeError(w, http.StatusBadRequest, "invalid content")
		return
	}
	item := model.ContentItem{ID: request.ID, Kind: kind, Slug: request.Slug, Visible: request.Visible}
	writeJSON(w, http.StatusOK, map[string]any{"issues": health.EvaluateItem(item, request.Data, nil)})
}
