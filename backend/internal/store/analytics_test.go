package store

import (
	"testing"
	"time"

	"github.com/gokceguler/portfolio/backend/internal/model"
)

func TestAnalyticsSchemaDoesNotStoreIPOrUserAgent(t *testing.T) {
	s := newTestStore(t)
	rows, err := s.db.Query("PRAGMA table_info(analytics_events)")
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	for rows.Next() {
		var cid int
		var name, columnType string
		var notNull, primaryKey int
		var defaultValue any
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultValue, &primaryKey); err != nil {
			t.Fatal(err)
		}
		if name == "ip" || name == "ip_address" || name == "user_agent" {
			t.Fatalf("privacy-sensitive column %q must not exist", name)
		}
	}
}

func TestAnalyticsSummaryCountsDailyVisitorOnce(t *testing.T) {
	s := newTestStore(t)
	now := time.Date(2026, 10, 1, 12, 0, 0, 0, time.UTC)
	for _, eventType := range []string{"page_view", "section_view"} {
		if err := s.RecordAnalyticsEvent(&model.AnalyticsEvent{
			EventType: eventType, Locale: "tr", Path: "/tr", VisitorID: "same-daily-hash",
			ReferrerSource: "direct", DeviceCategory: "desktop", CreatedAt: now,
		}); err != nil {
			t.Fatal(err)
		}
	}
	summary, err := s.AnalyticsSummary(7, now)
	if err != nil {
		t.Fatal(err)
	}
	if summary.Totals.UniqueVisitors != 1 || summary.Totals.PageViews != 1 || summary.Totals.SectionViews != 1 {
		t.Fatalf("unexpected totals: %+v", summary.Totals)
	}
}

func TestAnalyticsSummaryHonorsDateRange(t *testing.T) {
	s := newTestStore(t)
	now := time.Date(2026, 10, 1, 18, 0, 0, 0, time.UTC)
	events := []model.AnalyticsEvent{
		{EventType: "project_view", ProjectSlug: "recent-project", CreatedAt: now.AddDate(0, 0, -2)},
		{EventType: "project_view", ProjectSlug: "older-project", CreatedAt: now.AddDate(0, 0, -10)},
		{EventType: "page_view", CreatedAt: now.AddDate(0, 0, -31)},
	}
	for i := range events {
		events[i].Locale = "en"
		events[i].Path = "/en/projects"
		events[i].VisitorID = "visitor-" + events[i].ProjectSlug
		events[i].ReferrerSource = "direct"
		events[i].DeviceCategory = "desktop"
		if err := s.RecordAnalyticsEvent(&events[i]); err != nil {
			t.Fatal(err)
		}
	}
	seven, err := s.AnalyticsSummary(7, now)
	if err != nil {
		t.Fatal(err)
	}
	if seven.Totals.ProjectViews != 1 || len(seven.Daily) != 7 || len(seven.TopProjects) != 1 || seven.TopProjects[0].Slug != "recent-project" {
		t.Fatalf("unexpected 7-day summary: %+v", seven)
	}
	thirty, err := s.AnalyticsSummary(30, now)
	if err != nil {
		t.Fatal(err)
	}
	if thirty.Totals.ProjectViews != 2 || len(thirty.Daily) != 30 || len(thirty.TopProjects) != 2 {
		t.Fatalf("unexpected 30-day summary: %+v", thirty)
	}
}

func TestPurgeAnalyticsBefore(t *testing.T) {
	s := newTestStore(t)
	now := time.Date(2026, 10, 1, 12, 0, 0, 0, time.UTC)
	for _, createdAt := range []time.Time{now.AddDate(0, 0, -91), now.AddDate(0, 0, -89)} {
		if err := s.RecordAnalyticsEvent(&model.AnalyticsEvent{
			EventType: "page_view", Locale: "tr", Path: "/tr", VisitorID: createdAt.String(),
			ReferrerSource: "direct", DeviceCategory: "desktop", CreatedAt: createdAt,
		}); err != nil {
			t.Fatal(err)
		}
	}
	removed, err := s.PurgeAnalyticsBefore(now.AddDate(0, 0, -90))
	if err != nil || removed != 1 {
		t.Fatalf("expected one purged event, removed=%d err=%v", removed, err)
	}
}
