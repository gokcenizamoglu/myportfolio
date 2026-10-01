package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/url"
	"path"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/gokceguler/portfolio/backend/internal/store"
)

const analyticsBodyLimit = 8 << 10

var (
	analyticsEventTypes = map[string]bool{
		"page_view": true, "section_view": true, "project_view": true, "cv_download": true,
	}
	analyticsSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	botMarkers           = []string{"bot", "crawler", "spider", "slurp", "bingpreview", "headlesschrome", "facebookexternalhit"}
)

type AnalyticsHandler struct {
	store         *store.Store
	secret        []byte
	publicSiteURL string
	now           func() time.Time
}

func NewAnalyticsHandler(s *store.Store, secret []byte, publicSiteURL string) *AnalyticsHandler {
	return &AnalyticsHandler{
		store: s, secret: append([]byte(nil), secret...),
		publicSiteURL: strings.TrimRight(publicSiteURL, "/"),
		now:           time.Now,
	}
}

type analyticsEventRequest struct {
	EventType   string `json:"event_type"`
	Locale      string `json:"locale"`
	Path        string `json:"path"`
	ProjectSlug string `json:"project_slug"`
}

func (h *AnalyticsHandler) RecordEvent(w http.ResponseWriter, r *http.Request) {
	var input analyticsEventRequest
	if err := decodeLimitedJSON(w, r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validateAnalyticsEvent(input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if ignoreAnalyticsRequest(r, input.Path) {
		writeJSON(w, http.StatusAccepted, map[string]bool{"recorded": false})
		return
	}
	event := h.eventFromRequest(r, input.EventType, input.Locale, input.Path, input.ProjectSlug)
	if err := h.store.RecordAnalyticsEvent(&event); err != nil {
		writeError(w, http.StatusInternalServerError, "could not record event")
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]bool{"recorded": true})
}

func (h *AnalyticsHandler) Summary(w http.ResponseWriter, r *http.Request) {
	days := 30
	if value := r.URL.Query().Get("days"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil {
			writeError(w, http.StatusBadRequest, "days must be 7 or 30")
			return
		}
		days = parsed
	}
	summary, err := h.store.AnalyticsSummary(days, h.now().UTC())
	if errors.Is(err, store.ErrInvalidAnalyticsRange) {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load analytics")
		return
	}
	writeJSON(w, http.StatusOK, summary)
}

func (h *AnalyticsHandler) DownloadCV(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if !analyticsSlugPattern.MatchString(slug) {
		writeError(w, http.StatusNotFound, "document not found")
		return
	}
	item, err := h.store.GetContentBySlug("documents", slug, true)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "document not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load document")
		return
	}
	var document struct {
		Category string `json:"category"`
		FileURL  string `json:"file_url"`
	}
	if json.Unmarshal([]byte(item.Data), &document) != nil || document.Category != "cv" {
		writeError(w, http.StatusNotFound, "document not found")
		return
	}
	target, ok := h.safeDocumentURL(document.FileURL)
	if !ok {
		writeError(w, http.StatusNotFound, "document not found")
		return
	}
	locale := r.URL.Query().Get("locale")
	if locale != "tr" && locale != "en" {
		if strings.HasSuffix(slug, "-en") {
			locale = "en"
		} else {
			locale = "tr"
		}
	}
	eventPath := "/api/v1/documents/" + slug + "/download"
	if !ignoreAnalyticsRequest(r, eventPath) {
		event := h.eventFromRequest(r, "cv_download", locale, eventPath, "")
		if err := h.store.RecordAnalyticsEvent(&event); err != nil {
			writeError(w, http.StatusInternalServerError, "could not record download")
			return
		}
	}
	http.Redirect(w, r, target, http.StatusTemporaryRedirect)
}

func (h *AnalyticsHandler) eventFromRequest(r *http.Request, eventType, locale, eventPath, projectSlug string) model.AnalyticsEvent {
	now := h.now().UTC()
	return model.AnalyticsEvent{
		EventType: eventType, Locale: locale, Path: eventPath, ProjectSlug: projectSlug,
		ReferrerSource: referrerSource(r, h.publicSiteURL),
		VisitorID:      anonymousVisitorID(h.secret, now, clientIP(r), r.UserAgent()),
		DeviceCategory: deviceCategory(r.UserAgent()), CreatedAt: now,
	}
}

func (h *AnalyticsHandler) safeDocumentURL(raw string) (string, bool) {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || parsed.User != nil || parsed.Fragment != "" {
		return "", false
	}
	if parsed.IsAbs() {
		if parsed.Scheme != "https" && parsed.Scheme != "http" {
			return "", false
		}
		return parsed.String(), true
	}
	if !strings.HasPrefix(parsed.Path, "/") || path.Clean(parsed.Path) != parsed.Path || strings.Contains(parsed.Path, "..") {
		return "", false
	}
	if strings.HasPrefix(parsed.Path, "/uploads/") {
		return parsed.String(), true
	}
	if strings.HasPrefix(parsed.Path, "/documents/") && h.publicSiteURL != "" {
		return h.publicSiteURL + parsed.String(), true
	}
	return "", false
}

func validateAnalyticsEvent(input analyticsEventRequest) error {
	if !analyticsEventTypes[input.EventType] {
		return errors.New("invalid event_type")
	}
	if input.Locale != "tr" && input.Locale != "en" {
		return errors.New("locale must be tr or en")
	}
	if len(input.Path) == 0 || len(input.Path) > 512 || !strings.HasPrefix(input.Path, "/") {
		return errors.New("path must be a relative site path")
	}
	if input.ProjectSlug != "" && (len(input.ProjectSlug) > 120 || !analyticsSlugPattern.MatchString(input.ProjectSlug)) {
		return errors.New("invalid project_slug")
	}
	if input.EventType == "project_view" && input.ProjectSlug == "" {
		return errors.New("project_slug is required for project_view")
	}
	return nil
}

func decodeLimitedJSON(w http.ResponseWriter, r *http.Request, target any) error {
	r.Body = http.MaxBytesReader(w, r.Body, analyticsBodyLimit)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return errors.New("invalid request body")
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("request body must contain one JSON object")
	}
	return nil
}

func anonymousVisitorID(secret []byte, now time.Time, ip, userAgent string) string {
	dailyKey := hmac.New(sha256.New, secret)
	_, _ = dailyKey.Write([]byte(now.UTC().Format("2006-01-02")))
	digest := hmac.New(sha256.New, dailyKey.Sum(nil))
	_, _ = digest.Write([]byte(ip))
	_, _ = digest.Write([]byte{0})
	_, _ = digest.Write([]byte(userAgent))
	return hex.EncodeToString(digest.Sum(nil))
}

func ignoreAnalyticsRequest(r *http.Request, eventPath string) bool {
	if isAdminPath(eventPath) || isBot(r.UserAgent()) {
		return true
	}
	if ip := net.ParseIP(clientIP(r)); ip != nil && ip.IsLoopback() {
		return true
	}
	for _, raw := range []string{r.Host, r.Header.Get("Origin"), r.Referer()} {
		if isLocalAddress(raw) {
			return true
		}
	}
	return false
}

func isAdminPath(value string) bool {
	clean := "/" + strings.Trim(strings.ToLower(value), "/") + "/"
	return strings.Contains(clean, "/admin/")
}

func isBot(userAgent string) bool {
	lower := strings.ToLower(userAgent)
	for _, marker := range botMarkers {
		if strings.Contains(lower, marker) {
			return true
		}
	}
	return false
}

func isLocalAddress(raw string) bool {
	if raw == "" {
		return false
	}
	candidate := raw
	if !strings.Contains(candidate, "://") {
		candidate = "http://" + candidate
	}
	parsed, err := url.Parse(candidate)
	if err != nil {
		return false
	}
	host := strings.ToLower(parsed.Hostname())
	if host == "localhost" || strings.HasSuffix(host, ".localhost") {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}
	return strings.Trim(r.RemoteAddr, "[]")
}

func deviceCategory(userAgent string) string {
	lower := strings.ToLower(userAgent)
	switch {
	case lower == "":
		return "unknown"
	case strings.Contains(lower, "ipad") || strings.Contains(lower, "tablet"):
		return "tablet"
	case strings.Contains(lower, "mobi") || strings.Contains(lower, "iphone") || strings.Contains(lower, "android"):
		return "mobile"
	default:
		return "desktop"
	}
}

func referrerSource(r *http.Request, publicSiteURL string) string {
	referrer, err := url.Parse(r.Referer())
	if err != nil || referrer.Hostname() == "" {
		return "direct"
	}
	host := strings.ToLower(referrer.Hostname())
	siteHost := ""
	if parsed, err := url.Parse(publicSiteURL); err == nil {
		siteHost = strings.ToLower(parsed.Hostname())
	}
	requestHost := strings.ToLower(strings.Split(r.Host, ":")[0])
	if host == siteHost || host == requestHost {
		return "internal"
	}
	switch {
	case strings.Contains(host, "google."):
		return "google"
	case strings.Contains(host, "bing."):
		return "bing"
	case strings.Contains(host, "chatgpt.com") || strings.Contains(host, "openai.com"):
		return "chatgpt"
	case strings.Contains(host, "linkedin.com"):
		return "linkedin"
	case strings.Contains(host, "github.com"):
		return "github"
	default:
		return "other"
	}
}
