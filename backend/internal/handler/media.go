package handler

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/go-chi/chi/v5"
)

type MediaHandler struct{ directory string }

func NewMediaHandler(directory string) *MediaHandler { return &MediaHandler{directory: directory} }

// SVG is intentionally excluded: it can carry inline scripts and would be a
// stored-XSS vector when served back. Brand SVGs live in the frontend's static
// assets instead. Each extension is paired with the content types we accept
// after sniffing the real bytes, so a mislabelled file is rejected.
var allowedExtensions = map[string][]string{
	".png":  {"image/png"},
	".jpg":  {"image/jpeg"},
	".jpeg": {"image/jpeg"},
	".webp": {"image/webp"},
	".pdf":  {"application/pdf"},
}

func (h *MediaHandler) Upload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 16<<20)
	if err := r.ParseMultipartForm(16 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "file is too large")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()
	extension := strings.ToLower(filepath.Ext(header.Filename))
	allowedTypes, ok := allowedExtensions[extension]
	if !ok {
		writeError(w, http.StatusBadRequest, "unsupported file type")
		return
	}
	head := make([]byte, 512)
	n, _ := io.ReadFull(file, head)
	detected := http.DetectContentType(head[:n])
	if !slices.Contains(allowedTypes, detected) {
		writeError(w, http.StatusBadRequest, "file content does not match its extension")
		return
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeError(w, 500, "upload error")
		return
	}
	if err := os.MkdirAll(h.directory, 0o755); err != nil {
		writeError(w, 500, "upload directory error")
		return
	}
	bytes := make([]byte, 10)
	if _, err := rand.Read(bytes); err != nil {
		writeError(w, 500, "upload error")
		return
	}
	name := hex.EncodeToString(bytes) + extension
	destination, err := os.OpenFile(filepath.Join(h.directory, name), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		writeError(w, 500, "upload error")
		return
	}
	defer destination.Close()
	if _, err = io.Copy(destination, file); err != nil {
		writeError(w, 500, "upload error")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"url": "/uploads/" + name, "name": header.Filename})
}

func (h *MediaHandler) Serve(w http.ResponseWriter, r *http.Request) {
	name := filepath.Base(chi.URLParam(r, "name"))
	if name == "." || name == "" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("X-Content-Type-Options", "nosniff")
	http.ServeFile(w, r, filepath.Join(h.directory, name))
}
