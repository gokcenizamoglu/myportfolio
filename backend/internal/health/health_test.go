package health

import (
	"encoding/json"
	"testing"

	"github.com/gokceguler/portfolio/backend/internal/model"
)

type fixedChecker bool

func (value fixedChecker) Reachable(string) bool { return bool(value) }

func item(kind, slug string, visible bool, data map[string]any) model.ContentItem {
	raw, _ := json.Marshal(data)
	return model.ContentItem{ID: 7, Kind: kind, Slug: slug, Visible: visible, Data: string(raw)}
}

func hasCode(issues []Issue, code string) bool {
	for _, issue := range issues {
		if issue.Code == code {
			return true
		}
	}
	return false
}

func TestProjectHealthRules(t *testing.T) {
	project := item("projects", "sample", true, map[string]any{
		"name_tr": "Örnek", "description_tr": "Açıklama", "open_source": true,
		"live_url": "not-a-url", "tech_stack": []any{},
	})
	issues := EvaluateItem(project, decodeData(project.Data), nil)
	for _, code := range []string{"missing_en", "invalid_live_url", "open_source_without_github", "missing_tech_stack", "missing_project_problem", "missing_project_body", "missing_project_outcome"} {
		if !hasCode(issues, code) {
			t.Errorf("expected issue %s, got %+v", code, issues)
		}
	}
}

func TestVisibleMissingCoreIsCriticalButDraftIsWarning(t *testing.T) {
	data := map[string]any{"name_tr": "Başlık"}
	visible := EvaluateItem(item("projects", "visible", true, data), data, nil)
	draft := EvaluateItem(item("projects", "draft", false, data), data, nil)
	severity := func(issues []Issue) string {
		for _, issue := range issues {
			if issue.Code == "missing_core_content" {
				return issue.Severity
			}
		}
		return ""
	}
	if severity(visible) != "critical" || severity(draft) != "warning" {
		t.Fatalf("unexpected severities visible=%s draft=%s", severity(visible), severity(draft))
	}
}

func TestFileAndSEORules(t *testing.T) {
	document := item("documents", "cv", true, map[string]any{"title_tr": "CV", "title_en": "CV", "description_tr": "x", "description_en": "x", "file_url": "/documents/missing.pdf"})
	report := Evaluate([]model.ContentItem{document}, map[string]string{"title_tr": "Başlık"}, fixedChecker(false))
	for _, code := range []string{"unreachable_file", "missing_seo_title", "missing_seo_description"} {
		if !hasCode(report.Issues, code) {
			t.Errorf("expected %s, got %+v", code, report.Issues)
		}
	}
	if report.Score >= 100 || report.IssueCount == 0 || report.ByKind["documents"] == 0 {
		t.Fatalf("bad report: %+v", report)
	}
}

func decodeData(raw string) map[string]any {
	var data map[string]any
	_ = json.Unmarshal([]byte(raw), &data)
	return data
}
