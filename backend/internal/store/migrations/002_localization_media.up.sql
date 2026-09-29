PRAGMA foreign_keys=OFF;

ALTER TABLE content_items RENAME TO content_items_old;

CREATE TABLE content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('projects','experiences','education','certifications','skills','socials','documents')),
  slug TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kind, slug)
);

INSERT INTO content_items(id,kind,slug,data,sort_order,visible,created_at,updated_at)
SELECT id,kind,slug,data,sort_order,visible,created_at,updated_at FROM content_items_old;

DROP TABLE content_items_old;
CREATE INDEX idx_content_kind_order ON content_items(kind, sort_order, id);

UPDATE content_items SET data=json_set(data,
  '$.name_en',COALESCE(json_extract(data,'$.name'),''),
  '$.description_en',COALESCE(json_extract(data,'$.description'),''),
  '$.body_en',COALESCE(json_extract(data,'$.body'),'')) WHERE kind='projects';
UPDATE content_items SET data=json_set(data,'$.name_tr','Galerion','$.description_tr','Otomotiv sektörü için çok kiracılı bayi ve operasyon platformu.','$.body_tr','Rol tabanlı yetkilendirme, araç yönetimi, CRM, belgeler, giderler ve bayi ağı modüllerinin çekirdek mimarisi.') WHERE kind='projects' AND slug='galerion';
UPDATE content_items SET data=json_set(data,'$.name_tr','HasarLink','$.description_tr','Oto hasar onarım ve servis merkezleri için operasyon platformu.','$.body_tr','Gerçek zamanlı iletişim desteğiyle üretim geçişi ve on bir konteynerli dağıtım mimarisi.') WHERE kind='projects' AND slug='hasarlink';
UPDATE content_items SET data=json_set(data,'$.name_tr','Doc AI','$.description_tr','Yapay zekâ destekli belge işleme ve otomatik form doldurma sistemi.','$.body_tr','Uçtan uca belge alımı, sınıflandırma, çoklu dosya analizi ve yapılandırılmış veri çıkarımı.') WHERE kind='projects' AND slug='doc-ai';
UPDATE content_items SET data=json_set(data,'$.name_tr','MaritimeOS','$.description_tr','Alan odaklı denizcilik operasyonları platformu.','$.body_tr','İş akışı orkestrasyonu, iş kuralları ve olay odaklı durum yönetimi.') WHERE kind='projects' AND slug='maritimeos';

UPDATE content_items SET data=json_set(data,
  '$.role_en',COALESCE(json_extract(data,'$.role'),''),
  '$.description_en',COALESCE(json_extract(data,'$.description'),'')) WHERE kind='experiences';
UPDATE content_items SET data=json_set(data,'$.role_tr','Kurucu Mühendis ve Teknik Lider','$.description_tr','12 kişilik ekibin koordinasyonuyla birlikte mimari, production hazırlığı ve ürünler arası mühendislik sorumluluğu.') WHERE kind='experiences' AND slug='everion-lead';
UPDATE content_items SET data=json_set(data,'$.role_tr','Full-Stack ve Çözüm Mühendisi','$.description_tr','Otomotiv, sigorta, hukuk, İK, CRM ve yapay zekâ alanlarında 8’den fazla SaaS ürününe özellikler geliştirip production’a çıkardım.') WHERE kind='experiences' AND slug='everion-engineer';
UPDATE content_items SET data=json_set(data,'$.role_tr','Yazılım Mühendisi','$.description_tr','Dosya yönetimi, sigorta başvuruları, tahsilat ve raporlama için kurum içi hukuk yazılımları geliştirdim.') WHERE kind='experiences' AND slug='eksioglu';

UPDATE content_items SET data=json_set(data,
  '$.school_en',COALESCE(json_extract(data,'$.school'),''),
  '$.school_tr',COALESCE(json_extract(data,'$.school'),''),
  '$.degree_en',COALESCE(json_extract(data,'$.degree'),''),
  '$.degree_tr','Yazılım Mühendisliği Lisans (İngilizce)',
  '$.detail_en',COALESCE(json_extract(data,'$.detail'),''),
  '$.detail_tr','%100 Burslu') WHERE kind='education';
UPDATE content_items SET data=json_set(data,'$.name_en',COALESCE(json_extract(data,'$.name'),''),'$.name_tr',COALESCE(json_extract(data,'$.name'),'')) WHERE kind='certifications';
UPDATE content_items SET data=json_set(data,'$.group_en',COALESCE(json_extract(data,'$.group'),''),'$.group_tr',COALESCE(json_extract(data,'$.group'),'')) WHERE kind='skills';
UPDATE content_items SET data=json_set(data,'$.label_en',COALESCE(json_extract(data,'$.label'),''),'$.label_tr',COALESCE(json_extract(data,'$.label'),'')) WHERE kind='socials';

INSERT OR IGNORE INTO content_items(kind,slug,data,sort_order,visible) VALUES
('documents','cv-tr','{"title_tr":"Özgeçmiş — Türkçe","title_en":"Résumé — Turkish","description_tr":"Eğitim, deneyim ve teknik yetkinliklerimin Türkçe özeti.","description_en":"Turkish résumé covering my experience, education and technical background.","category":"cv","file_url":"/documents/Gokce_Guler_CV.pdf","year":"2026"}',1,1),
('documents','cv-en','{"title_tr":"Özgeçmiş — İngilizce","title_en":"Résumé — English","description_tr":"Deneyim ve teknik yetkinliklerimin İngilizce özeti.","description_en":"English résumé covering my experience and technical background.","category":"cv","file_url":"/documents/Gokce_Guler_CV_English.pdf","year":"2026"}',2,1);

INSERT OR IGNORE INTO site_settings(key,value)
SELECT 'tagline_en', value FROM site_settings WHERE key='tagline';
INSERT OR IGNORE INTO site_settings(key,value) VALUES
('title_tr','Full-Stack Yazılım Mühendisi'),
('title_en','Full-Stack Software Engineer'),
('tagline_tr','Karmaşık operasyonları çalışan, anlaşılır yazılım sistemlerine dönüştürüyorum.'),
('about_lead_tr','Fikri yalnızca ekrana değil, üretimde yaşayan bir sisteme dönüştürmeyi seven bir yazılım mühendisiyim.'),
('about_body_tr','Mimari, backend, frontend, altyapı ve yayın süreçleri arasında çalışıyorum. Otomotivden sigortaya, hukuk operasyonlarından yapay zekâ destekli belge işlemeye uzanan ürünler geliştirdim.'),
('availability_tr','İyi fikirler ve özenli mühendislik sohbetleri için her zaman açığım.'),
('about_lead_en','I enjoy turning an idea into a system that stays useful in production, not just a screen that looks finished.'),
('about_body_en','I work across architecture, backend, frontend, infrastructure and releases. My products span automotive, insurance, legal operations and AI-assisted document processing.'),
('availability_en','Always happy to talk about thoughtful products and careful engineering.'),
('logo_mark_url','/brand/yazısız.png'),
('logo_wordmark_url','/brand/ggu.png');

PRAGMA foreign_keys=ON;
