package health

import (
	"encoding/json"
	"fmt"
	"net/url"
	"sort"
	"strings"

	"github.com/gokceguler/portfolio/backend/internal/model"
)

type LinkChecker interface {
	Reachable(string) bool
}

type Issue struct {
	Code     string `json:"code"`
	Severity string `json:"severity"`
	Kind     string `json:"kind"`
	ID       int64  `json:"id,omitempty"`
	Slug     string `json:"slug,omitempty"`
	Locale   string `json:"locale,omitempty"`
	Field    string `json:"field,omitempty"`
	Message  string `json:"message"`
}

type Report struct {
	Score         int            `json:"score"`
	IssueCount    int            `json:"issue_count"`
	CriticalCount int            `json:"critical_count"`
	ByKind        map[string]int `json:"by_kind"`
	Issues        []Issue        `json:"issues"`
}

type ruleSchema struct {
	Title       string
	Description string
	Bilingual   []string
}

var schemas = map[string]ruleSchema{
	"projects":       {Title: "name", Description: "description", Bilingual: []string{"name", "description", "role", "problem", "body", "highlights", "outcome"}},
	"experiences":    {Title: "role", Description: "description", Bilingual: []string{"role", "description"}},
	"education":      {Title: "school", Description: "degree", Bilingual: []string{"school", "degree", "detail"}},
	"certifications": {Title: "name", Description: "description", Bilingual: []string{"name", "description"}},
	"skills":         {Title: "group", Bilingual: []string{"group"}},
	"socials":        {Title: "label", Bilingual: []string{"label"}},
	"documents":      {Title: "title", Description: "description", Bilingual: []string{"title", "description"}},
}

func Evaluate(items []model.ContentItem, settings map[string]string, checker LinkChecker) Report {
	issues := make([]Issue, 0)
	for _, item := range items {
		var data map[string]any
		if json.Unmarshal([]byte(item.Data), &data) != nil || data == nil {
			issues = append(issues, issue(item, "invalid_data", "critical", "", "", "Kayıt verisi okunamıyor."))
			continue
		}
		issues = append(issues, EvaluateItem(item, data, checker)...)
	}
	issues = append(issues, evaluateSEO(settings)...)
	return summarize(issues)
}

func EvaluateItem(item model.ContentItem, data map[string]any, checker LinkChecker) []Issue {
	schema, ok := schemas[item.Kind]
	if !ok {
		return nil
	}
	issues := make([]Issue, 0)
	for _, base := range schema.Bilingual {
		for _, locale := range []string{"tr", "en"} {
			field := base + "_" + locale
			if !hasText(data[field]) {
				issues = append(issues, issue(item, "missing_"+locale, "warning", locale, field, fmt.Sprintf("%s alanının %s karşılığı eksik.", label(base), strings.ToUpper(locale))))
			}
		}
	}
	missingCore := !hasLocalized(data, schema.Title) || (schema.Description != "" && !hasLocalized(data, schema.Description))
	if missingCore {
		severity := "warning"
		if item.Visible {
			severity = "critical"
		}
		issues = append(issues, issue(item, "missing_core_content", severity, "", schema.Title, "Başlık veya temel açıklama eksik."))
	}
	if item.Kind == "projects" {
		for _, base := range []string{"problem", "body", "outcome"} {
			if !hasLocalized(data, base) {
				issues = append(issues, issue(item, "missing_project_"+base, "warning", "", base, label(base)+" alanı eksik."))
			}
		}
		stack, ok := data["tech_stack"].([]any)
		if !ok || len(stack) == 0 {
			issues = append(issues, issue(item, "missing_tech_stack", "warning", "", "tech_stack", "Teknoloji listesi eksik."))
		}
		for _, field := range []string{"live_url", "github_url"} {
			if value, _ := data[field].(string); strings.TrimSpace(value) != "" && !validHTTPURL(value) {
				issues = append(issues, issue(item, "invalid_"+field, "warning", "", field, label(field)+" geçerli bir HTTP(S) adresi değil."))
			}
		}
		openSource, _ := data["open_source"].(bool)
		if openSource && !hasText(data["github_url"]) {
			issues = append(issues, issue(item, "open_source_without_github", "critical", "", "github_url", "Açık kaynak proje için GitHub bağlantısı eksik."))
		}
	}
	if item.Kind == "documents" || item.Kind == "certifications" {
		field := "file_url"
		if item.Kind == "certifications" {
			field = "attachment_url"
		}
		value, _ := data[field].(string)
		if strings.TrimSpace(value) == "" {
			issues = append(issues, issue(item, "missing_file", severityForVisible(item.Visible), "", field, "Dosya bağlantısı eksik."))
		} else if !validFileURL(value) {
			issues = append(issues, issue(item, "invalid_file", severityForVisible(item.Visible), "", field, "Dosya bağlantısı geçersiz."))
		} else if checker != nil && !checker.Reachable(value) {
			issues = append(issues, issue(item, "unreachable_file", severityForVisible(item.Visible), "", field, "Dosya bağlantısına ulaşılamıyor."))
		}
	}
	return deduplicate(issues)
}

func evaluateSEO(settings map[string]string) []Issue {
	issues := []Issue{}
	for _, locale := range []string{"tr", "en"} {
		if strings.TrimSpace(settings["seo_title_"+locale]) == "" {
			issues = append(issues, Issue{Code: "missing_seo_title", Severity: "warning", Kind: "settings", Locale: locale, Field: "seo_title_" + locale, Message: "SEO başlığı eksik; varsayılan başlık kullanılacak."})
		}
		if strings.TrimSpace(settings["seo_description_"+locale]) == "" && strings.TrimSpace(settings["seo_description"]) == "" {
			issues = append(issues, Issue{Code: "missing_seo_description", Severity: "warning", Kind: "settings", Locale: locale, Field: "seo_description_" + locale, Message: "SEO açıklaması eksik; sayfa metni kullanılacak."})
		}
	}
	return issues
}

func summarize(issues []Issue) Report {
	sort.SliceStable(issues, func(i, j int) bool {
		if issues[i].Severity != issues[j].Severity {
			return issues[i].Severity == "critical"
		}
		if issues[i].Kind != issues[j].Kind {
			return issues[i].Kind < issues[j].Kind
		}
		return issues[i].Slug < issues[j].Slug
	})
	report := Report{IssueCount: len(issues), ByKind: map[string]int{}, Issues: issues}
	warnings := 0
	for _, item := range issues {
		report.ByKind[item.Kind]++
		if item.Severity == "critical" {
			report.CriticalCount++
		} else {
			warnings++
		}
	}
	report.Score = 100 - report.CriticalCount*4 - (warnings+1)/2
	if report.Score < 0 {
		report.Score = 0
	}
	return report
}

func issue(item model.ContentItem, code, severity, locale, field, message string) Issue {
	return Issue{Code: code, Severity: severity, Kind: item.Kind, ID: item.ID, Slug: item.Slug, Locale: locale, Field: field, Message: message}
}

func severityForVisible(visible bool) string {
	if visible {
		return "critical"
	}
	return "warning"
}
func hasText(value any) bool { text, ok := value.(string); return ok && strings.TrimSpace(text) != "" }
func hasLocalized(data map[string]any, base string) bool {
	return hasText(data[base+"_tr"]) || hasText(data[base+"_en"]) || hasText(data[base])
}
func validHTTPURL(value string) bool {
	parsed, err := url.ParseRequestURI(value)
	return err == nil && (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host != ""
}
func validFileURL(value string) bool {
	return strings.HasPrefix(value, "/uploads/") || strings.HasPrefix(value, "/documents/") || validHTTPURL(value)
}
func label(field string) string {
	return map[string]string{"name": "Başlık", "role": "Rol", "description": "Açıklama", "problem": "Problem", "body": "Katkı", "highlights": "Öne çıkanlar", "outcome": "Sonuç", "degree": "Derece", "detail": "Detay", "school": "Okul", "group": "Grup", "label": "Etiket", "title": "Başlık", "live_url": "Canlı bağlantı", "github_url": "GitHub bağlantısı"}[field]
}
func deduplicate(items []Issue) []Issue {
	seen := map[string]bool{}
	out := make([]Issue, 0, len(items))
	for _, item := range items {
		key := item.Code + item.Locale + item.Field
		if !seen[key] {
			seen[key] = true
			out = append(out, item)
		}
	}
	return out
}
