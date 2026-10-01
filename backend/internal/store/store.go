package store

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/jmoiron/sqlx"
)

var AllowedKinds = map[string]bool{"projects": true, "experiences": true, "education": true, "certifications": true, "skills": true, "socials": true, "documents": true}

// ErrUnknownKind is returned when a content kind is not in the allowlist.
var ErrUnknownKind = errors.New("unknown content type")

// ErrNotFound is returned when an operation targets a row that does not exist.
var ErrNotFound = errors.New("not found")

type Store struct{ db *sqlx.DB }

func New(db *sqlx.DB) *Store { return &Store{db: db} }

func (s *Store) ListContent(kind string, visibleOnly bool) ([]model.ContentItem, error) {
	if !AllowedKinds[kind] {
		return nil, ErrUnknownKind
	}
	query := "SELECT * FROM content_items WHERE kind = ?"
	if visibleOnly {
		query += " AND visible = 1"
	}
	query += " ORDER BY sort_order ASC, id ASC"
	items := []model.ContentItem{}
	return items, s.db.Select(&items, query, kind)
}

func (s *Store) GetContent(kind string, id int64) (*model.ContentItem, error) {
	var item model.ContentItem
	return &item, s.db.Get(&item, "SELECT * FROM content_items WHERE kind = ? AND id = ?", kind, id)
}

func (s *Store) CreateContent(item *model.ContentItem) error {
	if !AllowedKinds[item.Kind] {
		return ErrUnknownKind
	}
	result, err := s.db.NamedExec(`INSERT INTO content_items(kind,slug,data,sort_order,visible) VALUES(:kind,:slug,:data,:sort_order,:visible)`, item)
	if err != nil {
		return err
	}
	item.ID, _ = result.LastInsertId()
	return s.db.Get(item, "SELECT * FROM content_items WHERE id = ?", item.ID)
}

func (s *Store) UpdateContent(item *model.ContentItem) error {
	_, err := s.db.NamedExec(`UPDATE content_items SET slug=:slug,data=:data,sort_order=:sort_order,visible=:visible,updated_at=CURRENT_TIMESTAMP WHERE id=:id AND kind=:kind`, item)
	return err
}

func (s *Store) ReorderContent(kind string, ids []int64) error {
	if !AllowedKinds[kind] {
		return ErrUnknownKind
	}
	tx, err := s.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	var count int
	if err := tx.Get(&count, "SELECT COUNT(*) FROM content_items WHERE kind = ?", kind); err != nil {
		return err
	}
	if count != len(ids) {
		return errors.New("reorder list must contain every item")
	}
	seen := make(map[int64]bool, len(ids))
	for index, id := range ids {
		if id <= 0 || seen[id] {
			return errors.New("reorder list contains an invalid or duplicate id")
		}
		seen[id] = true
		result, err := tx.Exec("UPDATE content_items SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE kind = ? AND id = ?", index+1, kind, id)
		if err != nil {
			return err
		}
		if affected, _ := result.RowsAffected(); affected != 1 {
			return errors.New("reorder list contains an unknown item")
		}
	}
	return tx.Commit()
}

func (s *Store) DeleteContent(kind string, id int64) error {
	if !AllowedKinds[kind] {
		return ErrUnknownKind
	}
	result, err := s.db.Exec("DELETE FROM content_items WHERE kind = ? AND id = ?", kind, id)
	if err != nil {
		return err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) AllSettings() (map[string]string, error) {
	rows := []struct {
		Key   string `db:"key"`
		Value string `db:"value"`
	}{}
	if err := s.db.Select(&rows, "SELECT key,value FROM site_settings ORDER BY key"); err != nil {
		return nil, err
	}
	out := make(map[string]string, len(rows))
	for _, row := range rows {
		out[row.Key] = row.Value
	}
	return out, nil
}

func (s *Store) SetSettings(settings map[string]string) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return err
	}
	for key, value := range settings {
		if _, err = tx.Exec(`INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`, key, value); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (s *Store) DeleteSetting(key string) error {
	_, err := s.db.Exec("DELETE FROM site_settings WHERE key = ?", key)
	return err
}

func (s *Store) GetAdmin(username string) (*model.AdminUser, error) {
	var user model.AdminUser
	return &user, s.db.Get(&user, "SELECT * FROM admin_users WHERE username = ?", username)
}

func (s *Store) CreateAdmin(user *model.AdminUser) error {
	_, err := s.db.NamedExec(`INSERT INTO admin_users(username,password_hash) VALUES(:username,:password_hash) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash`, user)
	return err
}

func tokenHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
func (s *Store) CreateSession(token, username string, expiresAt time.Time) error {
	_, err := s.db.Exec("INSERT INTO admin_sessions(token_hash,username,expires_at) VALUES(?,?,?)", tokenHash(token), username, expiresAt)
	return err
}
func (s *Store) SessionUser(token string) (string, error) {
	var username string
	// Compare against a Go-supplied time rather than CURRENT_TIMESTAMP so both
	// the stored value and the bound value pass through the driver's identical
	// time formatting — string-comparing mixed timestamp formats is unreliable.
	err := s.db.Get(&username, "SELECT username FROM admin_sessions WHERE token_hash = ? AND expires_at > ?", tokenHash(token), time.Now().UTC())
	return username, err
}
func (s *Store) DeleteSession(token string) error {
	_, err := s.db.Exec("DELETE FROM admin_sessions WHERE token_hash = ?", tokenHash(token))
	return err
}
func (s *Store) PurgeSessions() {
	s.db.Exec("DELETE FROM admin_sessions WHERE expires_at <= ?", time.Now().UTC())
}
