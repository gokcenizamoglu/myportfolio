// Package validate is the single source of truth for what a well-formed content
// item looks like per kind. Keeping it separate from the HTTP handler and the
// store means request parsing, persistence and the content contract each have
// one clear responsibility, and the admin UI schema has a server-side mirror.
package validate

import (
	"errors"
	"fmt"
)

// ErrNilData is returned when the request omits the data object or sends null.
var ErrNilData = errors.New("data must be a non-null JSON object")

// schema describes the fields a content kind understands. Fields not listed are
// accepted and left untouched, so the model can carry forward data the admin UI
// does not yet surface; listed fields are type-checked when present.
type schema struct {
	// title is the bilingual base name (e.g. "name") that must have a non-empty
	// value in at least one language — the item's required identity field.
	title string
	// bilingualText fields exist as <base>_tr / <base>_en strings.
	bilingualText []string
	// strings are plain string fields.
	strings []string
	// lists are arrays of strings.
	lists []string
	// bools are boolean flags.
	bools []string
	// required names non-bilingual string fields that must be present and
	// non-empty, beyond the title.
	required []string
}

// contentSchemas mirrors the admin panel's field schema (frontend components
// /admin/schemas.ts). The two must stay in step.
var contentSchemas = map[string]schema{
	"projects": {
		title:         "name",
		bilingualText: []string{"name", "description", "role", "problem", "body", "highlights", "outcome", "technical_notes", "live_url_label"},
		strings:       []string{"category", "status", "employer", "year", "start_date", "end_date", "live_url", "github_url", "presentation_url"},
		lists:         []string{"tech_stack", "domains"},
		bools:         []string{"featured", "open_source"},
	},
	"experiences": {
		title:         "role",
		bilingualText: []string{"role", "description"},
		strings:       []string{"company", "start_date", "end_date"},
		lists:         []string{"tech_stack"},
	},
	"education": {
		title:         "school",
		bilingualText: []string{"school", "degree", "detail"},
		strings:       []string{"start_date", "end_date"},
	},
	"certifications": {
		title:         "name",
		bilingualText: []string{"name", "description"},
		strings:       []string{"issuer", "year", "attachment_url", "badge_url", "credential_id"},
	},
	"articles": {
		title:         "title",
		bilingualText: []string{"title", "summary"},
		strings:       []string{"publication", "published_at", "url", "language"},
		lists:         []string{"topics"},
		bools:         []string{"featured"},
		required:      []string{"url"},
	},
	"skills": {
		title:         "group",
		bilingualText: []string{"group"},
		lists:         []string{"items"},
	},
	"socials": {
		title:         "label",
		bilingualText: []string{"label"},
		strings:       []string{"url"},
		required:      []string{"url"},
	},
	"documents": {
		title:         "title",
		bilingualText: []string{"title", "description"},
		strings:       []string{"category", "file_url", "year"},
		required:      []string{"file_url"},
	},
}

// KnownKind reports whether the kind has a content schema.
func KnownKind(kind string) bool {
	_, ok := contentSchemas[kind]
	return ok
}

// Content validates a decoded content payload for the given kind. It returns a
// human-readable error suitable for a 400 response, or nil when the data is
// well-formed.
func Content(kind string, data map[string]any) error {
	sc, ok := contentSchemas[kind]
	if !ok {
		return fmt.Errorf("unknown content type")
	}
	if data == nil {
		return ErrNilData
	}
	for _, base := range sc.bilingualText {
		for _, key := range []string{base + "_tr", base + "_en", base} {
			if value, present := data[key]; present {
				if err := expectString(key, value); err != nil {
					return err
				}
			}
		}
	}
	for _, key := range sc.strings {
		if value, present := data[key]; present {
			if err := expectString(key, value); err != nil {
				return err
			}
		}
	}
	for _, key := range sc.lists {
		if value, present := data[key]; present {
			if err := expectStringList(key, value); err != nil {
				return err
			}
		}
	}
	for _, key := range sc.bools {
		if value, present := data[key]; present {
			if _, ok := value.(bool); !ok {
				return fmt.Errorf("%s must be true or false", key)
			}
		}
	}
	return nil
}

func expectString(key string, value any) error {
	if _, ok := value.(string); !ok {
		return fmt.Errorf("%s must be a string", key)
	}
	return nil
}

func expectStringList(key string, value any) error {
	list, ok := value.([]any)
	if !ok {
		return fmt.Errorf("%s must be a list", key)
	}
	for _, item := range list {
		if _, ok := item.(string); !ok {
			return fmt.Errorf("%s must be a list of strings", key)
		}
	}
	return nil
}
