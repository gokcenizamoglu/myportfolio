-- Align experience records with the current CV while keeping project content intact.
UPDATE content_items SET data = json_set(data,
  '$.role_tr','Yazılım Mühendisi',
  '$.role_en','Software Engineer',
  '$.description_tr','Otomotiv, sigorta, hukuk, CRM ve yapay zekâ destekli doküman işleme alanlarında 8+ SaaS ürününde backend, web ve mobil özellikler geliştirdim. Django REST Framework, PostgreSQL, Redis ve Celery ile REST API’leri ve asenkron servisler geliştirdim; QRakter’ın offline-first senkronizasyonunu hayata geçirdim. Sprint önceliklendirme, görev sahipliği, kapasite planlama ve kod inceleme süreçlerini koordine ederek yönetim için teknik irtibat noktası oldum. Yaklaşık 15 VM’de Docker servisleri, sunucu yönetimi ve uygulama güvenliğini destekledim; dört Android uygulamasının yayınlarını, iyzico entegrasyonunu ve Apple Developer/App Store Connect kurulumunu yönettim.',
  '$.description_en','Developed and shipped backend, web and mobile capabilities across 8+ SaaS products spanning automotive, insurance, legal, CRM and AI-assisted document processing. Built REST APIs and asynchronous services with Django REST Framework, PostgreSQL, Redis and Celery; implemented QRakter’s offline-first synchronization. Coordinated sprint prioritization, task ownership, capacity planning and code reviews while serving as a technical point of contact for leadership. Supported Docker services, server administration and application security across approximately 15 VMs; managed releases for four Android applications, iyzico onboarding and the Apple Developer/App Store Connect setup.',
  '$.start_date','Mar 2025',
  '$.end_date','Present'
) WHERE kind = 'experiences' AND slug = 'everion-lead';

DELETE FROM content_items
WHERE kind = 'experiences' AND slug IN ('everion-engineer', 'software-engineer');

UPDATE content_items SET data = json_set(data,
  '$.description_tr','Dava yönetimi, sigorta ve tahkim başvuruları, tahsilat ve saha operasyonlarını kapsayan kurum içi hukuk sistemleri için backend ve frontend geliştirdim. Django ve React ile operasyonel panolar, raporlama arayüzleri ve Excel/PDF dışa aktarımları geliştirerek manuel iş akışlarını izlenebilir dijital süreçlere dönüştürdüm.',
  '$.description_en','Developed backend and frontend capabilities for internal legal systems covering case management, insurance and arbitration filings, collections and field operations. Built operational dashboards, reporting interfaces and Excel/PDF exports using Django and React, replacing manual workflows with trackable digital processes.'
) WHERE kind = 'experiences' AND slug = 'eksioglu';

UPDATE content_items SET data = json_set(data,
  '$.description_tr','Yazılım girişimleri için iş analizi dokümanları, kullanıcı senaryoları, süreç akışları ve fonksiyonel gereksinimler hazırladım; iş ihtiyaçlarını yapılandırılmış geliştirme girdilerine dönüştürerek gereksinim analizi ve proje dokümantasyonunu destekledim.',
  '$.description_en','Prepared business analyses, user scenarios, process flows and project documentation for software initiatives.'
) WHERE kind = 'experiences' AND slug IN ('skyland-intern', 'skyland', 'business-analyst-intern');

UPDATE content_items SET data = json_set(data,
  '$.description_tr','C#, ASP.NET, Entity Framework ve MSSQL kullanarak kurumsal kart sistemleri geliştirme çalışmalarına katkıda bulundum; özellik geliştirme, veritabanı odaklı uygulama akışları ve bakım görevlerini destekledim.',
  '$.description_en','Developed enterprise card-system features using C#, ASP.NET, Entity Framework and MSSQL.'
) WHERE kind = 'experiences' AND slug IN ('ziraat-intern', 'ziraat', 'software-engineering-intern');
