-- Keep the skills section concise and remove the duplicate groups introduced
-- by the CV import. Four deliberate groups scan better than a CV-style dump.
DELETE FROM content_items WHERE kind = 'skills';

INSERT INTO content_items(kind,slug,data,sort_order,visible) VALUES
('skills','backend-api','{"group_tr":"Backend & API","group_en":"Backend & API","items":["Python","Django","Django REST Framework","Go","C#","ASP.NET Core","Celery"]}',1,1),
('skills','frontend-mobile','{"group_tr":"Frontend & Mobil","group_en":"Frontend & Mobile","items":["TypeScript","React","Next.js","React Native","Expo","Tailwind CSS"]}',2,1),
('skills','data-architecture','{"group_tr":"Veri & Mimari","group_en":"Data & Architecture","items":["PostgreSQL","PostGIS","Redis","MSSQL","Multi-Tenancy","RBAC","Event-Driven Workflows"]}',3,1),
('skills','platform-cloud','{"group_tr":"Platform & Bulut","group_en":"Platform & Cloud","items":["Docker","GitHub Actions","Nginx","Linux","DigitalOcean","AWS S3","Firebase"]}',4,1);

-- The site speaks in the first person, so experience copy should do the same.
UPDATE content_items SET data = json_set(data,
  '$.description_tr','8+ SaaS ürününde backend, web ve mobil özellikleri gereksinim analizinden canlıya alıma kadar geliştirdim. REST API’leri ve offline-first mobil senkronizasyon akışlarını tasarladım; 12 kişilik ekibin sprint önceliklerini koordine ettim; altyapı ve mobil yayın süreçlerini yönettim.',
  '$.description_en','Across 8+ SaaS products, I developed backend, web and mobile capabilities from requirements through production. I designed REST APIs and offline-first mobile sync, coordinated sprint priorities for a 12-person team, and managed infrastructure and mobile releases.'
) WHERE kind = 'experiences' AND slug = 'software-engineer';

UPDATE content_items SET data = json_set(data,
  '$.description_tr','Dava takibi, sigorta başvuruları, tahsilat ve saha operasyonlarını kapsayan kurum içi hukuk sistemlerinde backend ve frontend geliştirdim; manuel iş akışlarını izlenebilir dijital panellere dönüştürdüm.',
  '$.description_en','I developed backend and frontend capabilities for internal legal systems covering case management, filings, collections and field operations, turning manual workflows into trackable digital dashboards.'
) WHERE kind = 'experiences' AND slug = 'eksioglu';

UPDATE content_items SET data = json_set(data,
  '$.description_tr','Yazılım projeleri için iş analizleri, kullanıcı senaryoları, süreç akışları ve proje dokümantasyonları hazırladım.',
  '$.description_en','I prepared business analyses, user scenarios, process flows and project documentation for software initiatives.'
) WHERE kind = 'experiences' AND slug = 'business-analyst-intern';

UPDATE content_items SET data = json_set(data,
  '$.description_tr','Kart Sistemleri ekibinde C#, ASP.NET, Entity Framework ve MSSQL kullanarak kurumsal yazılım özellikleri geliştirdim.',
  '$.description_en','On the Card Systems team, I developed enterprise software features using C#, ASP.NET, Entity Framework and MSSQL.'
) WHERE kind = 'experiences' AND slug = 'software-engineering-intern';
