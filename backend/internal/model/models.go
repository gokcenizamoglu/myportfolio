package model

import "time"

type ContentItem struct {
	ID        int64     `db:"id" json:"id"`
	Kind      string    `db:"kind" json:"kind"`
	Slug      string    `db:"slug" json:"slug"`
	Data      string    `db:"data" json:"-"`
	SortOrder int       `db:"sort_order" json:"sort_order"`
	Visible   bool      `db:"visible" json:"visible"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type AdminUser struct {
	ID           int64     `db:"id" json:"id"`
	Username     string    `db:"username" json:"username"`
	PasswordHash string    `db:"password_hash" json:"-"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

type AnalyticsEvent struct {
	ID             int64     `db:"id" json:"id"`
	EventType      string    `db:"event_type" json:"event_type"`
	Locale         string    `db:"locale" json:"locale"`
	Path           string    `db:"path" json:"path"`
	ProjectSlug    string    `db:"project_slug" json:"project_slug,omitempty"`
	ReferrerSource string    `db:"referrer_source" json:"referrer_source"`
	VisitorID      string    `db:"visitor_id" json:"-"`
	DeviceCategory string    `db:"device_category" json:"device_category"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
}

type AnalyticsTotals struct {
	UniqueVisitors int `db:"unique_visitors" json:"unique_visitors"`
	PageViews      int `db:"page_views" json:"page_views"`
	SectionViews   int `db:"section_views" json:"section_views"`
	ProjectViews   int `db:"project_views" json:"project_views"`
	CVDownloads    int `db:"cv_downloads" json:"cv_downloads"`
}

type AnalyticsDaily struct {
	Date string `json:"date"`
	AnalyticsTotals
}

type AnalyticsProject struct {
	Slug  string `db:"slug" json:"slug"`
	Views int    `db:"views" json:"views"`
}

type AnalyticsLocale struct {
	Locale string `db:"locale" json:"locale"`
	Views  int    `db:"views" json:"views"`
}

type AnalyticsSummary struct {
	PeriodDays  int                `json:"period_days"`
	StartDate   string             `json:"start_date"`
	EndDate     string             `json:"end_date"`
	Totals      AnalyticsTotals    `json:"totals"`
	Daily       []AnalyticsDaily   `json:"daily"`
	TopProjects []AnalyticsProject `json:"top_projects"`
	Locales     []AnalyticsLocale  `json:"locales"`
}
