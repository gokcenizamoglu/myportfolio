package cvimport

import (
	"encoding/json"
	"strings"

	"github.com/gokceguler/portfolio/backend/internal/model"
)

// BuildDraft matches each proposal against existing items of the same kind and
// produces the unwritten draft. Matching is by a normalized per-kind key.
func BuildDraft(existing map[string][]model.ContentItem, p Proposals, lang string) ImportDraft {
	byKind := map[string][]map[string]any{
		"experiences":    p.Experiences,
		"education":      p.Education,
		"certifications": p.Certifications,
		"skills":         p.Skills,
		"projects":       p.Projects,
	}
	draft := ImportDraft{Changes: []ProposedChange{}, Orphans: []Orphan{}}

	for _, kind := range kindsInScope {
		proposals := byKind[kind]
		index, dataByID := existingIndex(existing[kind], kind, lang)
		matched := map[int64]bool{}

		for _, prop := range proposals {
			key := matchKey(kind, prop, lang)
			change := ProposedChange{Kind: kind, Data: prop}
			if id, ok := index[key]; ok && key != "" {
				change.Action = "update"
				change.MatchedID = id
				change.Slug = slugForExisting(existing[kind], id)
				change.FieldDiffs = diffFields(kind, dataByID[id], prop, lang)
				matched[id] = true
			} else {
				change.Action = "create"
				change.Slug = slugify(firstNonEmpty(prop, matchFields[kind], lang))
				change.FieldDiffs = diffFields(kind, map[string]any{}, prop, lang)
			}
			draft.Changes = append(draft.Changes, change)
		}

		for _, item := range existing[kind] {
			if matched[item.ID] {
				continue
			}
			draft.Orphans = append(draft.Orphans, Orphan{
				Kind: kind, ID: item.ID, Slug: item.Slug,
				Label: firstNonEmpty(dataByID[item.ID], matchFields[kind], lang),
			})
		}
	}
	return draft
}

func existingIndex(items []model.ContentItem, kind, lang string) (map[string]int64, map[int64]map[string]any) {
	index := map[string]int64{}
	dataByID := map[int64]map[string]any{}
	for _, item := range items {
		var data map[string]any
		_ = json.Unmarshal([]byte(item.Data), &data)
		if data == nil {
			data = map[string]any{}
		}
		dataByID[item.ID] = data
		if key := matchKey(kind, data, lang); key != "" {
			index[key] = item.ID
		}
	}
	return index, dataByID
}

func slugForExisting(items []model.ContentItem, id int64) string {
	for _, item := range items {
		if item.ID == id {
			return item.Slug
		}
	}
	return ""
}

// matchKey normalizes the per-kind identity field (+ company for experiences)
// so the same real-world item lines up across a re-import.
func matchKey(kind string, data map[string]any, lang string) string {
	base := normalize(firstNonEmpty(data, matchFields[kind], lang))
	if base == "" {
		return ""
	}
	if kind == "experiences" {
		if company := normalize(str(data["company"])); company != "" {
			return company + "|" + base
		}
	}
	return base
}

// diffFields compares proposed values against existing values, key by key.
func diffFields(kind string, old, prop map[string]any, lang string) []FieldDiff {
	other := "en"
	if lang == "en" {
		other = "tr"
	}
	translated := map[string]bool{}
	for _, base := range bilingualKeys[kind] {
		translated[base+"_"+other] = true
	}
	keys := sortedKeys(prop)
	diffs := make([]FieldDiff, 0, len(keys))
	for _, k := range keys {
		newVal := str(prop[k])
		oldVal := str(old[k])
		diffs = append(diffs, FieldDiff{
			Field: k, Old: oldVal, New: newVal,
			AutoTranslated: translated[k],
			Changed:        newVal != oldVal,
		})
	}
	return diffs
}

func firstNonEmpty(data map[string]any, base, lang string) string {
	for _, k := range []string{base + "_" + lang, base, base + "_tr", base + "_en"} {
		if v := str(data[k]); v != "" {
			return v
		}
	}
	return ""
}

// str renders a JSON-decoded value as a string. Slices join with ", " so
// tech_stack / items compare as human-readable text in the diff.
func str(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return t
	case []any:
		parts := make([]string, 0, len(t))
		for _, e := range t {
			parts = append(parts, str(e))
		}
		return strings.Join(parts, ", ")
	case bool:
		if t {
			return "true"
		}
		return "false"
	case float64:
		return strings.TrimRight(strings.TrimRight(jsonNumber(t), "0"), ".")
	default:
		b, _ := json.Marshal(t)
		return string(b)
	}
}

func jsonNumber(f float64) string {
	b, _ := json.Marshal(f)
	return string(b)
}

func normalize(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

func sortedKeys(m map[string]any) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	// deterministic order for stable diffs/tests
	for i := 1; i < len(keys); i++ {
		for j := i; j > 0 && keys[j-1] > keys[j]; j-- {
			keys[j-1], keys[j] = keys[j], keys[j-1]
		}
	}
	return keys
}

// slugify produces a slug matching ^[a-z0-9]+(?:-[a-z0-9]+)*$ from arbitrary
// text, transliterating the Turkish letters the CV is likely to contain.
func slugify(s string) string {
	repl := strings.NewReplacer(
		"ç", "c", "ğ", "g", "ı", "i", "ö", "o", "ş", "s", "ü", "u",
		"Ç", "c", "Ğ", "g", "İ", "i", "Ö", "o", "Ş", "s", "Ü", "u",
	)
	s = strings.ToLower(repl.Replace(s))
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			prevDash = false
		} else if !prevDash {
			b.WriteRune('-')
			prevDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}
