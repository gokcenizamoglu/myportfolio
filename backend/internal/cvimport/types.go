package cvimport

import (
	"context"
)

// Proposals is the structured content Gemini returns for a CV. Each slice
// holds one map[string]any per item, keyed exactly like the admin content
// schema (bilingual fields as _tr/_en, others bare).
type Proposals struct {
	Experiences    []map[string]any `json:"experiences"`
	Education      []map[string]any `json:"education"`
	Certifications []map[string]any `json:"certifications"`
	Skills         []map[string]any `json:"skills"`
	Projects       []map[string]any `json:"projects"`
	Settings       map[string]any   `json:"settings"`
}

// FieldDiff is one field's before/after for the review UI.
type FieldDiff struct {
	Field          string `json:"field"`
	Old            string `json:"old"`
	New            string `json:"new"`
	AutoTranslated bool   `json:"auto_translated"`
	Changed        bool   `json:"changed"`
}

// ProposedChange is a single create-or-update the admin can accept.
type ProposedChange struct {
	Kind       string         `json:"kind"`
	Action     string         `json:"action"` // "create" | "update"
	MatchedID  int64          `json:"matched_id,omitempty"`
	Slug       string         `json:"slug"`
	Data       map[string]any `json:"data"`
	FieldDiffs []FieldDiff    `json:"field_diffs"`
}

// Orphan is an existing item no proposal matched (candidate for deletion).
type Orphan struct {
	Kind  string `json:"kind"`
	ID    int64  `json:"id"`
	Slug  string `json:"slug"`
	Label string `json:"label"`
}

// ImportDraft is the full, unwritten result returned to the browser.
type ImportDraft struct {
	Changes  []ProposedChange `json:"changes"`
	Orphans  []Orphan         `json:"orphans"`
	Settings []FieldDiff      `json:"settings"`
}

// Extractor turns a CV PDF into structured Proposals.
type Extractor interface {
	ExtractCV(ctx context.Context, pdf []byte, lang, existingSummary string) (Proposals, error)
}

// kindsInScope is the fixed order CV import processes.
var kindsInScope = []string{"experiences", "education", "certifications", "skills", "projects"}

// matchFields is the per-kind field (bilingual base name or bare key) used to
// identify "the same" item across a CV re-import.
var matchFields = map[string]string{
	"experiences":    "role",
	"education":      "school",
	"certifications": "name",
	"skills":         "group",
	"projects":       "name",
}

// bilingualKeys lists the base names that exist as _tr/_en per kind, so the
// diff builder can flag the non-primary language as auto-translated.
var bilingualKeys = map[string][]string{
	"experiences":    {"role", "description"},
	"education":      {"school", "degree", "detail"},
	"certifications": {"name"},
	"skills":         {"group"},
	"projects":       {"name", "description", "body"},
	"settings":       {"about_lead", "about_body", "tagline"},
}
