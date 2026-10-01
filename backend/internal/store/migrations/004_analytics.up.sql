CREATE TABLE analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view','section_view','project_view','cv_download')),
  locale TEXT NOT NULL CHECK (locale IN ('tr','en')),
  path TEXT NOT NULL,
  project_slug TEXT NOT NULL DEFAULT '',
  referrer_source TEXT NOT NULL DEFAULT 'direct',
  visitor_id TEXT NOT NULL,
  device_category TEXT NOT NULL DEFAULT 'unknown' CHECK (device_category IN ('desktop','mobile','tablet','unknown')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_event_created ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_project_created ON analytics_events(project_slug, created_at);
CREATE INDEX idx_analytics_locale_created ON analytics_events(locale, created_at);
CREATE INDEX idx_analytics_visitor_created ON analytics_events(visitor_id, created_at);
