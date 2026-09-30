package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/gokceguler/portfolio/backend/internal/store"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

func withURLParam(r *http.Request, key, value string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

func newTestHandler(t *testing.T) *AdminHandler {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := sqlx.Open("sqlite", dbPath+"?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)
	t.Cleanup(func() { db.Close() })
	if err := store.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	s := store.New(db)
	hash, _ := bcrypt.GenerateFromPassword([]byte("correct-horse-battery"), bcrypt.DefaultCost)
	if err := s.CreateAdmin(&model.AdminUser{Username: "gokce", PasswordHash: string(hash)}); err != nil {
		t.Fatalf("seed admin: %v", err)
	}
	return NewAdminHandler(s)
}

func postJSON(h http.HandlerFunc, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/login", strings.NewReader(body))
	rec := httptest.NewRecorder()
	h(rec, req)
	return rec
}

func TestLoginRejectsWrongPassword(t *testing.T) {
	h := newTestHandler(t)
	rec := postJSON(h.Login, `{"username":"gokce","password":"wrong"}`)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
	if strings.Contains(rec.Body.String(), "token") {
		t.Fatal("failed login must not leak a session token")
	}
}

func TestLoginRejectsUnknownUserWithoutLeaking(t *testing.T) {
	h := newTestHandler(t)
	rec := postJSON(h.Login, `{"username":"ghost","password":"whatever"}`)
	// Same status and shape as a wrong password — no signal that the user is absent.
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unknown user, got %d", rec.Code)
	}
}

func TestLoginSucceedsAndSetsSecureCookie(t *testing.T) {
	h := newTestHandler(t)
	rec := postJSON(h.Login, `{"username":"gokce","password":"correct-horse-battery"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d (%s)", rec.Code, rec.Body.String())
	}
	cookie := rec.Header().Get("Set-Cookie")
	if !strings.Contains(cookie, "portfolio_session=") {
		t.Fatalf("expected a session cookie, got %q", cookie)
	}
	if !strings.Contains(cookie, "HttpOnly") {
		t.Fatalf("session cookie must be HttpOnly, got %q", cookie)
	}
}

func TestCreateContentValidatesSlug(t *testing.T) {
	h := newTestHandler(t)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/content/projects", bytes.NewReader([]byte(`{"slug":"Not A Slug","data":{}}`)))
	req = withURLParam(req, "kind", "projects")
	rec := httptest.NewRecorder()
	h.CreateContent(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid slug, got %d", rec.Code)
	}
}

func TestContentOutputDefaultsLegacyProjectFeaturedState(t *testing.T) {
	featured := contentOutput(model.ContentItem{Kind: "projects", Data: `{}`, SortOrder: 5})
	if featured["data"].(map[string]any)["featured"] != true {
		t.Fatal("legacy project in the first five positions should default to featured")
	}

	other := contentOutput(model.ContentItem{Kind: "projects", Data: `{"featured":false}`, SortOrder: 1})
	if other["data"].(map[string]any)["featured"] != false {
		t.Fatal("explicit featured=false must be preserved")
	}
}

func TestUpdateSettingsRejectsBadKey(t *testing.T) {
	h := newTestHandler(t)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/admin/settings", strings.NewReader(`{"Bad Key!":"x"}`))
	rec := httptest.NewRecorder()
	h.UpdateSettings(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid setting key, got %d", rec.Code)
	}
	var body map[string]string
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	if body["error"] == "" {
		t.Fatal("expected an error message")
	}
}
