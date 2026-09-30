package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	authmw "github.com/gokceguler/portfolio/backend/internal/middleware"
	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/gokceguler/portfolio/backend/internal/store"
	"golang.org/x/crypto/bcrypt"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
var settingKeyPattern = regexp.MustCompile(`^[a-z][a-z0-9_]{0,63}$`)

// dummyHash lets the login path spend the same work whether or not the
// username exists, so response timing does not reveal valid usernames.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("timing-equalizer-not-a-real-password"), bcrypt.DefaultCost)

const maxSettings = 200

type AdminHandler struct{ store *store.Store }

func NewAdminHandler(s *store.Store) *AdminHandler { return &AdminHandler{store: s} }

func (h *AdminHandler) Login(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&request) != nil {
		writeError(w, 400, "invalid request")
		return
	}
	user, err := h.store.GetAdmin(request.Username)
	if err != nil {
		// Compare against a dummy hash so a missing user costs the same time
		// as a wrong password, closing the username-enumeration side channel.
		_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(request.Password))
		writeError(w, 401, "invalid credentials")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(request.Password)) != nil {
		writeError(w, 401, "invalid credentials")
		return
	}
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		writeError(w, 500, "session error")
		return
	}
	token := hex.EncodeToString(bytes)
	expires := time.Now().UTC().Add(24 * time.Hour)
	if err := h.store.CreateSession(token, user.Username, expires); err != nil {
		writeError(w, 500, "session error")
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "portfolio_session", Value: token, Path: "/", HttpOnly: true, Secure: os.Getenv("APP_ENV") == "production", SameSite: http.SameSiteLaxMode, Expires: expires, MaxAge: 86400})
	writeJSON(w, 200, map[string]string{"username": user.Username})
}

func (h *AdminHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie("portfolio_session"); err == nil {
		_ = h.store.DeleteSession(cookie.Value)
	}
	http.SetCookie(w, &http.Cookie{Name: "portfolio_session", Value: "", Path: "/", HttpOnly: true, MaxAge: -1})
	writeJSON(w, 200, map[string]string{"message": "logged out"})
}
func (h *AdminHandler) Me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]string{"username": authmw.AdminFromContext(r.Context())})
}

type contentRequest struct {
	Slug      string         `json:"slug"`
	Data      map[string]any `json:"data"`
	SortOrder int            `json:"sort_order"`
	Visible   *bool          `json:"visible"`
}

func (h *AdminHandler) ListContent(w http.ResponseWriter, r *http.Request) {
	kind := chi.URLParam(r, "kind")
	items, err := h.store.ListContent(kind, false)
	if err != nil {
		writeError(w, 404, "unknown content type")
		return
	}
	output := make([]map[string]any, 0, len(items))
	for _, item := range items {
		output = append(output, contentOutput(item))
	}
	writeJSON(w, 200, output)
}

func (h *AdminHandler) CreateContent(w http.ResponseWriter, r *http.Request) {
	kind := chi.URLParam(r, "kind")
	var request contentRequest
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20)).Decode(&request) != nil || !slugPattern.MatchString(request.Slug) {
		writeError(w, 400, "valid slug and data are required")
		return
	}
	data, _ := json.Marshal(request.Data)
	visible := true
	if request.Visible != nil {
		visible = *request.Visible
	}
	item := model.ContentItem{Kind: kind, Slug: request.Slug, Data: string(data), SortOrder: request.SortOrder, Visible: visible}
	if err := h.store.CreateContent(&item); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	writeJSON(w, 201, contentOutput(item))
}

func (h *AdminHandler) UpdateContent(w http.ResponseWriter, r *http.Request) {
	kind := chi.URLParam(r, "kind")
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, 400, "invalid id")
		return
	}
	item, err := h.store.GetContent(kind, id)
	if err != nil {
		writeError(w, 404, "not found")
		return
	}
	var request contentRequest
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20)).Decode(&request) != nil || !slugPattern.MatchString(request.Slug) {
		writeError(w, 400, "valid slug and data are required")
		return
	}
	data, _ := json.Marshal(request.Data)
	item.Slug = request.Slug
	item.Data = string(data)
	item.SortOrder = request.SortOrder
	if request.Visible != nil {
		item.Visible = *request.Visible
	}
	if err := h.store.UpdateContent(item); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	writeJSON(w, 200, contentOutput(*item))
}

func (h *AdminHandler) DeleteContent(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, 400, "invalid id")
		return
	}
	if err := h.store.DeleteContent(chi.URLParam(r, "kind"), id); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) GetSettings(w http.ResponseWriter, _ *http.Request) {
	settings, err := h.store.AllSettings()
	if err != nil {
		writeError(w, 500, "could not load settings")
		return
	}
	writeJSON(w, 200, settings)
}
func (h *AdminHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var settings map[string]string
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&settings) != nil {
		writeError(w, 400, "invalid settings")
		return
	}
	if len(settings) > maxSettings {
		writeError(w, 400, "too many settings keys")
		return
	}
	for key, value := range settings {
		if !settingKeyPattern.MatchString(key) {
			writeError(w, 400, "invalid setting key: "+key)
			return
		}
		if len(value) > 20000 {
			writeError(w, 400, "setting value too long: "+key)
			return
		}
	}
	if err := h.store.SetSettings(settings); err != nil {
		writeError(w, 500, "could not save settings")
		return
	}
	writeJSON(w, 200, settings)
}
func (h *AdminHandler) DeleteSetting(w http.ResponseWriter, r *http.Request) {
	if err := h.store.DeleteSetting(chi.URLParam(r, "key")); err != nil {
		writeError(w, 500, "could not delete setting")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func contentOutput(item model.ContentItem) map[string]any {
	var data map[string]any
	_ = json.Unmarshal([]byte(item.Data), &data)
	if item.Kind == "projects" {
		if _, exists := data["featured"]; !exists {
			data["featured"] = item.SortOrder <= 5
		}
	}
	return map[string]any{"id": item.ID, "kind": item.Kind, "slug": item.Slug, "data": data, "sort_order": item.SortOrder, "visible": item.Visible, "created_at": item.CreatedAt, "updated_at": item.UpdatedAt}
}
