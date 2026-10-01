package validate

import (
	"encoding/json"
	"errors"
	"testing"
)

// decode mirrors how the handler receives data: a JSON object decoded into a map.
func decode(t *testing.T, raw string) map[string]any {
	t.Helper()
	if raw == "null" {
		return nil
	}
	var data map[string]any
	if err := json.Unmarshal([]byte(raw), &data); err != nil {
		t.Fatalf("bad test json %q: %v", raw, err)
	}
	return data
}

func TestContentAcceptsWellFormedProject(t *testing.T) {
	data := decode(t, `{"name_tr":"Galerion","name_en":"Galerion","tech_stack":["Go","React"],"featured":true,"year":"2025"}`)
	if err := Content("projects", data); err != nil {
		t.Fatalf("expected valid project, got %v", err)
	}
}

func TestContentRejectsNilData(t *testing.T) {
	if err := Content("projects", nil); !errors.Is(err, ErrNilData) {
		t.Fatalf("expected ErrNilData, got %v", err)
	}
}

func TestContentAllowsSemanticallyIncompleteDrafts(t *testing.T) {
	if err := Content("projects", decode(t, `{"description_tr":"x"}`)); err != nil {
		t.Fatalf("health warnings must not block drafts: %v", err)
	}
}

func TestContentTypeChecksFields(t *testing.T) {
	cases := map[string]string{
		"list given a string":   `{"name_tr":"ok","tech_stack":"Go, React"}`,
		"list with non-strings": `{"name_tr":"ok","tech_stack":["Go",3]}`,
		"bool given a string":   `{"name_tr":"ok","featured":"yes"}`,
		"string given a number": `{"name_tr":"ok","year":2025}`,
	}
	for name, raw := range cases {
		if err := Content("projects", decode(t, raw)); err == nil {
			t.Fatalf("%s: expected a type error", name)
		}
	}
}

func TestContentRejectsUnknownKind(t *testing.T) {
	if err := Content("malicious", map[string]any{}); err == nil {
		t.Fatal("expected unknown kind to be rejected")
	}
}

func TestContentAllowsMissingEssentialFieldsForHealthWarnings(t *testing.T) {
	if err := Content("socials", decode(t, `{"label_tr":"GitHub","url":"https://x"}`)); err != nil {
		t.Fatalf("valid social rejected: %v", err)
	}
	if err := Content("documents", decode(t, `{"title_tr":"CV"}`)); err != nil {
		t.Fatalf("missing file should be a non-blocking health warning: %v", err)
	}
}
