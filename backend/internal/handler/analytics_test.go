package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	authmw "github.com/gokceguler/portfolio/backend/internal/middleware"
	"github.com/gokceguler/portfolio/backend/internal/model"
)

func analyticsRequest(method, target, body string) *http.Request {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	req.RemoteAddr = "203.0.113.10:4321"
	req.Host = "gokceguler.com"
	req.Header.Set("Origin", "https://gokceguler.com")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
	return req
}

func TestAnalyticsRejectsInvalidEventType(t *testing.T) {
	h := NewAnalyticsHandler(newTestStore(t), []byte("test-secret"), "https://gokceguler.com")
	rec := httptest.NewRecorder()
	h.RecordEvent(rec, analyticsRequest(http.MethodPost, "/api/v1/analytics/events", `{"event_type":"password_seen","locale":"tr","path":"/tr"}`))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d (%s)", rec.Code, rec.Body.String())
	}
}

func TestAnalyticsIgnoresBotsAndLocalhost(t *testing.T) {
	for _, test := range []struct {
		name   string
		mutate func(*http.Request)
	}{
		{name: "bot", mutate: func(r *http.Request) { r.Header.Set("User-Agent", "Googlebot/2.1") }},
		{name: "localhost", mutate: func(r *http.Request) {
			r.RemoteAddr = "127.0.0.1:4321"
			r.Host = "localhost:3000"
			r.Header.Set("Origin", "http://localhost:3000")
		}},
	} {
		t.Run(test.name, func(t *testing.T) {
			s := newTestStore(t)
			h := NewAnalyticsHandler(s, []byte("test-secret"), "https://gokceguler.com")
			h.now = func() time.Time { return time.Date(2026, 10, 1, 12, 0, 0, 0, time.UTC) }
			req := analyticsRequest(http.MethodPost, "/api/v1/analytics/events", `{"event_type":"page_view","locale":"tr","path":"/tr"}`)
			test.mutate(req)
			rec := httptest.NewRecorder()
			h.RecordEvent(rec, req)
			if rec.Code != http.StatusAccepted || !strings.Contains(rec.Body.String(), `"recorded":false`) {
				t.Fatalf("expected ignored event, got %d (%s)", rec.Code, rec.Body.String())
			}
			summary, err := s.AnalyticsSummary(7, h.now())
			if err != nil || summary.Totals.PageViews != 0 {
				t.Fatalf("ignored event was stored: summary=%+v err=%v", summary, err)
			}
		})
	}
}

func TestAnonymousVisitorIDRotatesDaily(t *testing.T) {
	secret := []byte("test-secret")
	first := time.Date(2026, 10, 1, 23, 59, 0, 0, time.UTC)
	sameDay := time.Date(2026, 10, 1, 1, 0, 0, 0, time.UTC)
	nextDay := first.Add(2 * time.Minute)
	a := anonymousVisitorID(secret, first, "203.0.113.10", "browser")
	b := anonymousVisitorID(secret, sameDay, "203.0.113.10", "browser")
	c := anonymousVisitorID(secret, nextDay, "203.0.113.10", "browser")
	if a != b {
		t.Fatal("same visitor must have the same hash during one UTC day")
	}
	if a == c {
		t.Fatal("visitor hash must rotate at the UTC day boundary")
	}
}

func TestAdminAnalyticsRequiresSession(t *testing.T) {
	s := newTestStore(t)
	h := NewAnalyticsHandler(s, []byte("test-secret"), "https://gokceguler.com")
	router := chi.NewRouter()
	router.With(authmw.AdminAuth(s)).Get("/api/v1/admin/analytics", h.Summary)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/admin/analytics?days=7", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d (%s)", rec.Code, rec.Body.String())
	}
}

func TestCVDownloadRecordsEventAndRedirects(t *testing.T) {
	s := newTestStore(t)
	if err := s.CreateContent(&model.ContentItem{
		Kind: "documents", Slug: "cv-test", Visible: true,
		Data: `{"category":"cv","file_url":"/documents/Gokce_Guler_CV.pdf"}`,
	}); err != nil {
		t.Fatal(err)
	}
	h := NewAnalyticsHandler(s, []byte("test-secret"), "https://gokceguler.com")
	h.now = func() time.Time { return time.Date(2026, 10, 1, 12, 0, 0, 0, time.UTC) }
	router := chi.NewRouter()
	router.Get("/api/v1/documents/{slug}/download", h.DownloadCV)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, analyticsRequest(http.MethodGet, "/api/v1/documents/cv-test/download?locale=tr", ""))
	if rec.Code != http.StatusTemporaryRedirect {
		t.Fatalf("expected redirect, got %d (%s)", rec.Code, rec.Body.String())
	}
	if location := rec.Header().Get("Location"); location != "https://gokceguler.com/documents/Gokce_Guler_CV.pdf" {
		t.Fatalf("unexpected safe redirect target %q", location)
	}
	summary, err := s.AnalyticsSummary(7, h.now())
	if err != nil || summary.Totals.CVDownloads != 1 {
		t.Fatalf("expected one CV download, summary=%+v err=%v", summary, err)
	}
}

func TestAnalyticsRequestBodyIsLimited(t *testing.T) {
	h := NewAnalyticsHandler(newTestStore(t), []byte("test-secret"), "https://gokceguler.com")
	body := `{"event_type":"page_view","locale":"tr","path":"/` + strings.Repeat("x", analyticsBodyLimit) + `"}`
	rec := httptest.NewRecorder()
	h.RecordEvent(rec, analyticsRequest(http.MethodPost, "/api/v1/analytics/events", body))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected oversized body to be rejected, got %d", rec.Code)
	}
}
