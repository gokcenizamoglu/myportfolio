package gemini

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gokceguler/portfolio/backend/internal/cvimport"
)

const defaultModel = "gemini-2.5-flash"

var _ cvimport.Extractor = (*Client)(nil)

// Client calls the Gemini generateContent endpoint. It implements
// cvimport.Extractor. Construct with New; a nil *Client means "not configured".
type Client struct {
	apiKey string
	model  string
	http   *http.Client
}

func New(apiKey, model string) *Client {
	if apiKey == "" {
		return nil
	}
	if model == "" {
		model = defaultModel
	}
	return &Client{apiKey: apiKey, model: model, http: &http.Client{Timeout: 60 * time.Second}}
}

func (c *Client) ExtractCV(ctx context.Context, pdf []byte, lang, existingSummary string) (cvimport.Proposals, error) {
	reqBody := map[string]any{
		"contents": []any{map[string]any{
			"parts": []any{
				map[string]any{"inline_data": map[string]any{"mime_type": "application/pdf", "data": base64.StdEncoding.EncodeToString(pdf)}},
				map[string]any{"text": buildPrompt(lang, existingSummary)},
			},
		}},
		"generationConfig": map[string]any{"responseMimeType": "application/json", "temperature": 0.2},
	}
	raw, err := json.Marshal(reqBody)
	if err != nil {
		return cvimport.Proposals{}, err
	}
	// The API key is sent as a header (not a query param) so it can never leak
	// into a *url.Error message.
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", c.model)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return cvimport.Proposals{}, errors.New("gemini: building request failed")
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", c.apiKey)
	resp, err := c.http.Do(req)
	if err != nil {
		return cvimport.Proposals{}, fmt.Errorf("gemini request failed: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return cvimport.Proposals{}, fmt.Errorf("gemini read response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return cvimport.Proposals{}, fmt.Errorf("gemini status %d", resp.StatusCode)
	}
	return parseResponse(body)
}

func parseResponse(body []byte) (cvimport.Proposals, error) {
	var envelope struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(body, &envelope); err != nil {
		return cvimport.Proposals{}, err
	}
	if len(envelope.Candidates) == 0 || len(envelope.Candidates[0].Content.Parts) == 0 {
		return cvimport.Proposals{}, errors.New("gemini returned no candidates")
	}
	var p cvimport.Proposals
	if err := json.Unmarshal([]byte(envelope.Candidates[0].Content.Parts[0].Text), &p); err != nil {
		return cvimport.Proposals{}, fmt.Errorf("gemini content was not valid proposal JSON: %w", err)
	}
	return p, nil
}

func buildPrompt(lang, existingSummary string) string {
	return fmt.Sprintf(`You extract a résumé/CV into structured JSON for a bilingual (Turkish/English) portfolio.

The CV's primary language is %q. For every bilingual field, return BOTH a _tr and an _en value; translate into the other language faithfully and concisely.

Return ONLY a JSON object with these keys (omit a key if the CV has nothing for it):
- "experiences": [{ "role_tr","role_en","company","description_tr","description_en","tech_stack":[..],"start_date","end_date" }]
- "education": [{ "school_tr","school_en","degree_tr","degree_en","detail_tr","detail_en","start_date","end_date" }]
- "certifications": [{ "name_tr","name_en","issuer","year" }]
- "skills": [{ "group_tr","group_en","items":[..] }]
- "projects": [{ "name_tr","name_en","description_tr","description_en","body_tr","body_en","tech_stack":[..],"category","employer","year" }]
- "settings": { "about_lead_tr","about_lead_en","about_body_tr","about_body_en","tagline_tr","tagline_en" }

Rules: dates as short strings (e.g. "Mar 2025", "Present"). tech_stack/items are arrays of short strings. Do not invent facts not in the CV. Match the tone of the existing content below where relevant.

Existing content (for tone/consistency, do not copy verbatim):
%s`, lang, existingSummary)
}
