DELETE FROM content_items WHERE kind='documents';
DELETE FROM site_settings WHERE key LIKE '%_tr' OR key LIKE '%_en' OR key IN ('logo_mark_url','logo_wordmark_url');
