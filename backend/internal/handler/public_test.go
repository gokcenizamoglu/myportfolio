package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/gokceguler/portfolio/backend/internal/store"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

func newTestStore(t *testing.T) *store.Store {
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
	return store.New(db)
}

// A row whose data column is a stored "null" must not crash the public endpoint:
// the derived-field logic would otherwise write into a nil map and panic.
func TestPortfolioSurvivesNullDataRow(t *testing.T) {
	s := newTestStore(t)
	if err := s.CreateContent(&model.ContentItem{Kind: "projects", Slug: "broken", Data: "null", SortOrder: 1, Visible: true}); err != nil {
		t.Fatalf("seed row: %v", err)
	}
	h := NewPublicHandler(s)
	rec := httptest.NewRecorder()
	h.Portfolio(rec, httptest.NewRequest(http.MethodGet, "/api/v1/portfolio", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d (%s)", rec.Code, rec.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid json: %v", err)
	}
	projects, ok := body["projects"].([]any)
	if !ok || len(projects) != 1 {
		t.Fatalf("expected one project in the response, got %v", body["projects"])
	}
}
