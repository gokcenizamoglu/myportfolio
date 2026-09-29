package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gokceguler/portfolio/backend/internal/cvimport"
	"github.com/gokceguler/portfolio/backend/internal/store"
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

type fakeExtractor struct{ out cvimport.Proposals }

func (f fakeExtractor) ExtractCV(_ context.Context, _ []byte, _, _ string) (cvimport.Proposals, error) {
	return f.out, nil
}

func newImportTestStore(t *testing.T) *store.Store {
	t.Helper()
	db, err := sqlx.Open("sqlite", filepath.Join(t.TempDir(), "t.db")+"?_pragma=journal_mode(WAL)")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	db.SetMaxOpenConns(1)
	t.Cleanup(func() { db.Close() })
	if err := store.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return store.New(db)
}

func multipartPDF(t *testing.T, field, filename string, content []byte) (*bytes.Buffer, string) {
	t.Helper()
	buf := &bytes.Buffer{}
	mw := multipart.NewWriter(buf)
	fw, _ := mw.CreateFormFile(field, filename)
	fw.Write(content)
	mw.WriteField("lang", "tr")
	mw.Close()
	return buf, mw.FormDataContentType()
}

func TestImportReturns503WhenExtractorNil(t *testing.T) {
	h := NewCVImportHandler(newImportTestStore(t), nil)
	body, ct := multipartPDF(t, "file", "cv.pdf", []byte("%PDF-1.4 test"))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/cv/import", body)
	req.Header.Set("Content-Type", ct)
	rec := httptest.NewRecorder()
	h.Import(rec, req)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("want 503, got %d", rec.Code)
	}
}

func TestImportRejectsNonPDF(t *testing.T) {
	h := NewCVImportHandler(newImportTestStore(t), fakeExtractor{})
	body, ct := multipartPDF(t, "file", "cv.png", []byte("\x89PNG\r\n\x1a\n"))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/cv/import", body)
	req.Header.Set("Content-Type", ct)
	rec := httptest.NewRecorder()
	h.Import(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want 400 for non-pdf, got %d", rec.Code)
	}
}

func TestImportRejectsFakePDFByContent(t *testing.T) {
	h := NewCVImportHandler(newImportTestStore(t), fakeExtractor{})
	body, ct := multipartPDF(t, "file", "cv.pdf", []byte("\x89PNG\r\n\x1a\n"))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/cv/import", body)
	req.Header.Set("Content-Type", ct)
	rec := httptest.NewRecorder()
	h.Import(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("want 400 for non-pdf content, got %d", rec.Code)
	}
}

func TestImportReturnsDraft(t *testing.T) {
	h := NewCVImportHandler(newImportTestStore(t), fakeExtractor{out: cvimport.Proposals{
		Certifications: []map[string]any{{"name_tr": "AWS", "name_en": "AWS", "issuer": "Amazon", "year": "2025"}},
	}})
	body, ct := multipartPDF(t, "file", "cv.pdf", []byte("%PDF-1.4 hello"))
	req := httptest.NewRequest(http.MethodPost, "/api/v1/admin/cv/import", body)
	req.Header.Set("Content-Type", ct)
	rec := httptest.NewRecorder()
	h.Import(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("want 200, got %d (%s)", rec.Code, rec.Body.String())
	}
	var draft cvimport.ImportDraft
	if err := json.Unmarshal(rec.Body.Bytes(), &draft); err != nil {
		t.Fatalf("decode draft: %v", err)
	}
	if len(draft.Changes) != 1 || draft.Changes[0].Kind != "certifications" || draft.Changes[0].Action != "create" {
		t.Fatalf("unexpected draft: %+v", draft.Changes)
	}
}
