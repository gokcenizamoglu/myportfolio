package cvimport

import (
	"regexp"
	"testing"

	"github.com/gokceguler/portfolio/backend/internal/model"
)

func TestBuildDraftMatchesExistingAndFlagsChanges(t *testing.T) {
	existing := map[string][]model.ContentItem{
		"experiences": {{
			ID: 7, Kind: "experiences", Slug: "everion-engineer",
			Data: `{"role_tr":"Mühendis","role_en":"Engineer","company":"Everion","description_tr":"eski","description_en":"old"}`,
		}},
	}
	p := Proposals{Experiences: []map[string]any{{
		"role_tr": "Mühendis", "role_en": "Engineer", "company": "Everion",
		"description_tr": "yeni", "description_en": "new",
	}}}

	draft := BuildDraft(existing, p, "tr")

	if len(draft.Changes) != 1 {
		t.Fatalf("want 1 change, got %d", len(draft.Changes))
	}
	c := draft.Changes[0]
	if c.Action != "update" || c.MatchedID != 7 || c.Slug != "everion-engineer" {
		t.Fatalf("bad match: action=%s id=%d slug=%s", c.Action, c.MatchedID, c.Slug)
	}
	changed := map[string]FieldDiff{}
	for _, d := range c.FieldDiffs {
		changed[d.Field] = d
	}
	if !changed["description_tr"].Changed || changed["description_tr"].Old != "eski" || changed["description_tr"].New != "yeni" {
		t.Fatalf("description_tr diff wrong: %+v", changed["description_tr"])
	}
	if changed["role_tr"].Changed {
		t.Fatalf("role_tr unchanged should not be flagged changed")
	}
	// lang=tr -> _en fields are the translated ones
	if !changed["description_en"].AutoTranslated {
		t.Fatalf("description_en should be auto_translated when lang=tr")
	}
}

func TestBuildDraftCreatesWhenNoMatchAndSlugifies(t *testing.T) {
	draft := BuildDraft(map[string][]model.ContentItem{}, Proposals{
		Certifications: []map[string]any{{"name_tr": "AWS Çözüm Mimarı", "name_en": "AWS Solutions Architect", "issuer": "Amazon", "year": "2025"}},
	}, "tr")
	if len(draft.Changes) != 1 {
		t.Fatalf("want 1 change, got %d", len(draft.Changes))
	}
	c := draft.Changes[0]
	if c.Action != "create" {
		t.Fatalf("want create, got %s", c.Action)
	}
	if c.Slug != "aws-cozum-mimari" && c.Slug != "aws-solutions-architect" {
		t.Fatalf("slug not slugified from name: %q", c.Slug)
	}
	for _, d := range c.FieldDiffs {
		if d.Old != "" || !d.Changed {
			t.Fatalf("create diffs must be additions (old empty, changed true): %+v", d)
		}
	}
}

func TestBuildDraftReportsOrphans(t *testing.T) {
	existing := map[string][]model.ContentItem{
		"skills": {{ID: 3, Kind: "skills", Slug: "backend", Data: `{"group_tr":"Backend","group_en":"Backend"}`}},
	}
	draft := BuildDraft(existing, Proposals{Skills: []map[string]any{}}, "tr")
	if len(draft.Orphans) != 1 || draft.Orphans[0].ID != 3 || draft.Orphans[0].Kind != "skills" {
		t.Fatalf("want 1 skills orphan, got %+v", draft.Orphans)
	}
}

func TestStr(t *testing.T) {
	cases := []struct {
		in   any
		want string
	}{
		{float64(2020), "2020"},
		{float64(1.5), "1.5"},
		{[]any{"a", "b"}, "a, b"},
		{true, "true"},
	}
	for _, c := range cases {
		if got := str(c.in); got != c.want {
			t.Errorf("str(%v) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestSlugifyNeverEmpty(t *testing.T) {
	re := regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	for _, in := range []string{"", "日本語", "---", "Çalışma Örneği"} {
		got := slugify(in)
		if got == "" || !re.MatchString(got) {
			t.Errorf("slugify(%q) = %q, want non-empty valid slug", in, got)
		}
	}
}
