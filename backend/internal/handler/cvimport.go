package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gokceguler/portfolio/backend/internal/cvimport"
	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/gokceguler/portfolio/backend/internal/store"
)

type CVImportHandler struct {
	store     *store.Store
	extractor cvimport.Extractor
}

func NewCVImportHandler(s *store.Store, e cvimport.Extractor) *CVImportHandler {
	return &CVImportHandler{store: s, extractor: e}
}

func (h *CVImportHandler) Import(w http.ResponseWriter, r *http.Request) {
	if h.extractor == nil {
		writeError(w, http.StatusServiceUnavailable, "cv import is not configured")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16<<20)
	if err := r.ParseMultipartForm(16 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "file is too large")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "a CV PDF is required")
		return
	}
	defer file.Close()

	if strings.ToLower(filepath.Ext(header.Filename)) != ".pdf" {
		writeError(w, http.StatusBadRequest, "only PDF CVs are supported")
		return
	}
	head := make([]byte, 512)
	n, _ := io.ReadFull(file, head)
	if http.DetectContentType(head[:n]) != "application/pdf" {
		writeError(w, http.StatusBadRequest, "file content is not a PDF")
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeError(w, http.StatusInternalServerError, "read error")
		return
	}
	pdf, err := io.ReadAll(file)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "read error")
		return
	}

	lang := r.FormValue("lang")
	if lang != "en" {
		lang = "tr"
	}

	existing := map[string][]model.ContentItem{}
	for _, kind := range []string{"experiences", "education", "certifications", "skills", "projects"} {
		items, err := h.store.ListContent(kind, false)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "could not load existing content")
			return
		}
		existing[kind] = items
	}

	proposals, err := h.extractor.ExtractCV(r.Context(), pdf, lang, existingSummary(existing))
	if err != nil {
		writeError(w, http.StatusBadGateway, "CV extraction failed: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, cvimport.BuildDraft(existing, proposals, lang))
}

// existingSummary is a compact JSON of current content passed to the model for
// tone/consistency. It never includes secrets.
func existingSummary(existing map[string][]model.ContentItem) string {
	out := map[string][]map[string]any{}
	for kind, items := range existing {
		for _, item := range items {
			var data map[string]any
			_ = json.Unmarshal([]byte(item.Data), &data)
			out[kind] = append(out[kind], data)
		}
	}
	b, _ := json.Marshal(out)
	return string(b)
}
