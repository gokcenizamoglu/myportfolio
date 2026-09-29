package store

import (
	"path/filepath"
	"testing"
	"time"

	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := sqlx.Open("sqlite", dbPath+"?_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	db.SetMaxOpenConns(1)
	t.Cleanup(func() { db.Close() })
	if err := Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return New(db)
}

func TestContentLifecycle(t *testing.T) {
	s := newTestStore(t)

	item := &model.ContentItem{Kind: "projects", Slug: "galerion", Data: `{"name":"Galerion"}`, SortOrder: 1, Visible: true}
	if err := s.CreateContent(item); err != nil {
		t.Fatalf("create: %v", err)
	}
	if item.ID == 0 {
		t.Fatal("expected an assigned id after create")
	}

	item.Data = `{"name":"Galerion v2"}`
	if err := s.UpdateContent(item); err != nil {
		t.Fatalf("update: %v", err)
	}
	got, err := s.GetContent("projects", item.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.Data != `{"name":"Galerion v2"}` {
		t.Fatalf("update not persisted, got %q", got.Data)
	}

	if err := s.DeleteContent("projects", item.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if items, _ := s.ListContent("projects", false); len(items) != 0 {
		t.Fatalf("expected empty list after delete, got %d", len(items))
	}
}

func TestContentRejectsUnknownKind(t *testing.T) {
	s := newTestStore(t)
	if err := s.CreateContent(&model.ContentItem{Kind: "malicious", Slug: "x"}); err == nil {
		t.Fatal("expected unknown kind to be rejected")
	}
	if _, err := s.ListContent("malicious", false); err == nil {
		t.Fatal("expected listing an unknown kind to fail")
	}
}

func TestVisibleOnlyFiltersHiddenItems(t *testing.T) {
	s := newTestStore(t)
	_ = s.CreateContent(&model.ContentItem{Kind: "projects", Slug: "shown", Visible: true})
	_ = s.CreateContent(&model.ContentItem{Kind: "projects", Slug: "hidden", Visible: false})

	all, _ := s.ListContent("projects", false)
	if len(all) != 2 {
		t.Fatalf("expected 2 items unfiltered, got %d", len(all))
	}
	visible, _ := s.ListContent("projects", true)
	if len(visible) != 1 || visible[0].Slug != "shown" {
		t.Fatalf("expected only the visible item, got %+v", visible)
	}
}

func TestSessionLifecycle(t *testing.T) {
	s := newTestStore(t)
	if err := s.CreateAdmin(&model.AdminUser{Username: "gokce", PasswordHash: "hash"}); err != nil {
		t.Fatalf("create admin: %v", err)
	}

	if err := s.CreateSession("token-abc", "gokce", time.Now().UTC().Add(time.Hour)); err != nil {
		t.Fatalf("create session: %v", err)
	}
	user, err := s.SessionUser("token-abc")
	if err != nil || user != "gokce" {
		t.Fatalf("expected session to resolve to gokce, got %q err=%v", user, err)
	}

	// A raw token that was never stored must not resolve — the store only
	// keeps the SHA-256 hash, so a leaked DB row cannot be replayed directly.
	if _, err := s.SessionUser("token-does-not-exist"); err == nil {
		t.Fatal("expected unknown token to fail")
	}

	if err := s.DeleteSession("token-abc"); err != nil {
		t.Fatalf("delete session: %v", err)
	}
	if _, err := s.SessionUser("token-abc"); err == nil {
		t.Fatal("expected deleted session to fail")
	}
}

func TestExpiredSessionRejected(t *testing.T) {
	s := newTestStore(t)
	_ = s.CreateAdmin(&model.AdminUser{Username: "gokce", PasswordHash: "hash"})
	_ = s.CreateSession("expired", "gokce", time.Now().UTC().Add(-time.Minute))
	if _, err := s.SessionUser("expired"); err == nil {
		t.Fatal("expected expired session to be rejected")
	}
}

func TestSettingsUpsert(t *testing.T) {
	s := newTestStore(t)
	if err := s.SetSettings(map[string]string{"title_en": "Engineer"}); err != nil {
		t.Fatalf("set: %v", err)
	}
	if err := s.SetSettings(map[string]string{"title_en": "Founding Engineer"}); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	all, err := s.AllSettings()
	if err != nil {
		t.Fatalf("all: %v", err)
	}
	if all["title_en"] != "Founding Engineer" {
		t.Fatalf("expected upsert to overwrite, got %q", all["title_en"])
	}
}
