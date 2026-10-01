package store

import (
	"errors"
	"time"

	"github.com/gokceguler/portfolio/backend/internal/model"
)

var ErrInvalidAnalyticsRange = errors.New("analytics range must be 7 or 30 days")

func (s *Store) RecordAnalyticsEvent(event *model.AnalyticsEvent) error {
	if event.CreatedAt.IsZero() {
		event.CreatedAt = time.Now().UTC()
	}
	result, err := s.db.NamedExec(`INSERT INTO analytics_events
		(event_type,locale,path,project_slug,referrer_source,visitor_id,device_category,created_at)
		VALUES (:event_type,:locale,:path,:project_slug,:referrer_source,:visitor_id,:device_category,:created_at)`, event)
	if err != nil {
		return err
	}
	event.ID, _ = result.LastInsertId()
	return nil
}

func (s *Store) AnalyticsSummary(days int, now time.Time) (model.AnalyticsSummary, error) {
	if days != 7 && days != 30 {
		return model.AnalyticsSummary{}, ErrInvalidAnalyticsRange
	}
	end := dayStart(now.UTC())
	start := end.AddDate(0, 0, -(days - 1))
	upper := end.AddDate(0, 0, 1)
	summary := model.AnalyticsSummary{
		PeriodDays:  days,
		StartDate:   start.Format("2006-01-02"),
		EndDate:     end.Format("2006-01-02"),
		Daily:       make([]model.AnalyticsDaily, days),
		TopProjects: []model.AnalyticsProject{},
		Locales:     []model.AnalyticsLocale{},
	}

	if err := s.db.Get(&summary.Totals, `SELECT
		COUNT(DISTINCT visitor_id) AS unique_visitors,
		COALESCE(SUM(CASE WHEN event_type='page_view' THEN 1 ELSE 0 END), 0) AS page_views,
		COALESCE(SUM(CASE WHEN event_type='section_view' THEN 1 ELSE 0 END), 0) AS section_views,
		COALESCE(SUM(CASE WHEN event_type='project_view' THEN 1 ELSE 0 END), 0) AS project_views,
		COALESCE(SUM(CASE WHEN event_type='cv_download' THEN 1 ELSE 0 END), 0) AS cv_downloads
		FROM analytics_events WHERE created_at >= ? AND created_at < ?`, start, upper); err != nil {
		return model.AnalyticsSummary{}, err
	}

	type dailyRow struct {
		Date string `db:"date"`
		model.AnalyticsTotals
	}
	rows := []dailyRow{}
	if err := s.db.Select(&rows, `SELECT substr(created_at, 1, 10) AS date,
		COUNT(DISTINCT visitor_id) AS unique_visitors,
		SUM(CASE WHEN event_type='page_view' THEN 1 ELSE 0 END) AS page_views,
		SUM(CASE WHEN event_type='section_view' THEN 1 ELSE 0 END) AS section_views,
		SUM(CASE WHEN event_type='project_view' THEN 1 ELSE 0 END) AS project_views,
		SUM(CASE WHEN event_type='cv_download' THEN 1 ELSE 0 END) AS cv_downloads
		FROM analytics_events WHERE created_at >= ? AND created_at < ?
		GROUP BY substr(created_at, 1, 10) ORDER BY substr(created_at, 1, 10)`, start, upper); err != nil {
		return model.AnalyticsSummary{}, err
	}
	byDate := make(map[string]model.AnalyticsTotals, len(rows))
	for _, row := range rows {
		byDate[row.Date] = row.AnalyticsTotals
	}
	for i := 0; i < days; i++ {
		date := start.AddDate(0, 0, i).Format("2006-01-02")
		summary.Daily[i] = model.AnalyticsDaily{Date: date, AnalyticsTotals: byDate[date]}
	}

	if err := s.db.Select(&summary.TopProjects, `SELECT project_slug AS slug, COUNT(*) AS views
		FROM analytics_events WHERE event_type='project_view' AND project_slug <> '' AND created_at >= ? AND created_at < ?
		GROUP BY project_slug ORDER BY views DESC, project_slug ASC LIMIT 10`, start, upper); err != nil {
		return model.AnalyticsSummary{}, err
	}
	if err := s.db.Select(&summary.Locales, `SELECT locale, COUNT(*) AS views
		FROM analytics_events WHERE created_at >= ? AND created_at < ?
		GROUP BY locale ORDER BY views DESC, locale ASC`, start, upper); err != nil {
		return model.AnalyticsSummary{}, err
	}
	return summary, nil
}

func (s *Store) PurgeAnalyticsBefore(cutoff time.Time) (int64, error) {
	result, err := s.db.Exec("DELETE FROM analytics_events WHERE created_at < ?", cutoff.UTC())
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

func dayStart(value time.Time) time.Time {
	year, month, day := value.Date()
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}
