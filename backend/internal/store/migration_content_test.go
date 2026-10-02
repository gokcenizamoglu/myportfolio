package store

import (
	"path/filepath"
	"testing"

	"github.com/gokceguler/portfolio/backend/internal/health"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

func TestPortfolioStoryMigrationIsComplete(t *testing.T) {
	db, err := sqlx.Open("sqlite", filepath.Join(t.TempDir(), "portfolio.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if err := Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	if err := Seed(db); err != nil {
		t.Fatalf("seed missing baseline content: %v", err)
	}
	s := New(db)
	projects, err := s.ListContent("projects", true)
	if err != nil {
		t.Fatal(err)
	}
	if len(projects) != 10 {
		t.Fatalf("expected 10 curated projects, got %d", len(projects))
	}
	for _, forbidden := range []string{"arac-deger-kaybi", "zayfix"} {
		if _, err := s.GetContentBySlug("projects", forbidden, false); err == nil {
			t.Fatalf("project %q must not be published as personal work", forbidden)
		}
	}
	articles, err := s.ListContent("articles", true)
	if err != nil || len(articles) != 12 {
		t.Fatalf("expected 12 articles, got %d (err=%v)", len(articles), err)
	}
	items, err := s.AllContent()
	if err != nil {
		t.Fatal(err)
	}
	settings, err := s.AllSettings()
	if err != nil {
		t.Fatal(err)
	}
	report := health.Evaluate(items, settings, nil)
	if report.IssueCount != 0 {
		t.Fatalf("expected zero content-health issues, got %d: %+v", report.IssueCount, report.Issues)
	}
}
