package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestContentHealthReport(t *testing.T) {
	h := NewContentHealthHandler(newTestStore(t), nil)
	recorder := httptest.NewRecorder()
	h.Report(recorder, httptest.NewRequest(http.MethodGet, "/api/v1/admin/content/health", nil))
	if recorder.Code != http.StatusOK || !strings.Contains(recorder.Body.String(), `"score"`) || !strings.Contains(recorder.Body.String(), `"issues"`) {
		t.Fatalf("unexpected health response: %d %s", recorder.Code, recorder.Body.String())
	}
}

func TestContentHealthCheckReturnsWarningsWithoutBlocking(t *testing.T) {
	h := NewContentHealthHandler(newTestStore(t), nil)
	request := httptest.NewRequest(http.MethodPost, "/api/v1/admin/content/projects/health", strings.NewReader(`{"id":1,"slug":"draft","visible":true,"data":{"name_tr":"Taslak","open_source":true}}`))
	request = withURLParam(request, "kind", "projects")
	recorder := httptest.NewRecorder()
	h.CheckItem(recorder, request)
	if recorder.Code != http.StatusOK || !strings.Contains(recorder.Body.String(), `"open_source_without_github"`) || !strings.Contains(recorder.Body.String(), `"missing_core_content"`) {
		t.Fatalf("expected non-blocking health warnings: %d %s", recorder.Code, recorder.Body.String())
	}
}
