package gemini

import "testing"

func TestParseResponseExtractsProposals(t *testing.T) {
	// Gemini returns the model's JSON as a string in candidates[0].content.parts[0].text.
	body := []byte(`{
	  "candidates":[{"content":{"parts":[{"text":"{\"experiences\":[{\"role_tr\":\"Mühendis\",\"role_en\":\"Engineer\",\"company\":\"Everion\"}],\"skills\":[]}"}]}}]
	}`)
	p, err := parseResponse(body)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if len(p.Experiences) != 1 || p.Experiences[0]["company"] != "Everion" {
		t.Fatalf("experiences not parsed: %+v", p.Experiences)
	}
}

func TestParseResponseErrorsOnNoCandidates(t *testing.T) {
	if _, err := parseResponse([]byte(`{"candidates":[]}`)); err == nil {
		t.Fatal("expected error when no candidates returned")
	}
}

func TestBuildPromptMentionsLanguageAndSchema(t *testing.T) {
	prompt := buildPrompt("tr", `{"experiences":[]}`)
	if !contains(prompt, "_tr") || !contains(prompt, "_en") {
		t.Fatal("prompt must ask for bilingual _tr/_en fields")
	}
	if !contains(prompt, "experiences") || !contains(prompt, "certifications") {
		t.Fatal("prompt must describe the target schema keys")
	}
}

func contains(haystack, needle string) bool {
	return len(haystack) >= len(needle) && (indexOf(haystack, needle) >= 0)
}
func indexOf(h, n string) int {
	for i := 0; i+len(n) <= len(h); i++ {
		if h[i:i+len(n)] == n {
			return i
		}
	}
	return -1
}
