package store

import (
	"encoding/json"

	"github.com/gokceguler/portfolio/backend/internal/model"
	"github.com/jmoiron/sqlx"
)

// Seed loads the canonical portfolio content. It only runs against an empty
// database, so it doubles as the single source of truth for the site's
// content: to refresh a dev database, delete it and run with --seed.
func Seed(db *sqlx.DB) error {
	// Guard on projects specifically: schema migrations seed the CV documents,
	// so content_items is non-empty on a fresh DB before this runs. Projects
	// are only ever created here, making them the reliable "already seeded" mark.
	var count int
	if err := db.Get(&count, "SELECT COUNT(*) FROM content_items WHERE kind = 'projects'"); err != nil || count > 0 {
		return err
	}
	s := New(db)
	add := func(kind, slug string, order int, data map[string]any) error {
		raw, _ := json.Marshal(data)
		return s.CreateContent(&model.ContentItem{Kind: kind, Slug: slug, Data: string(raw), SortOrder: order, Visible: true})
	}

	type row struct {
		slug string
		data map[string]any
	}

	projects := []row{
		{"galerion", map[string]any{
			"featured":       true,
			"name_tr":        "Galerion", "name_en": "Galerion",
			"description_tr": "Otomotiv sektörü için çok kiracılı galeri ve operasyon platformu.",
			"description_en": "Multi-tenant dealership and operations platform for the automotive industry.",
			"role_tr":        "Ana mühendis — çekirdek backend mimarisi", "role_en": "Primary engineer — core backend architecture",
			"body_tr":        "Rol tabanlı yetkilendirmeli multi-tenant mimariyi Django REST Framework, PostgreSQL/PostGIS, Redis ve Celery ile tasarlayıp geliştirdim. Araç yönetimi, CRM, doküman, masraf, raporlama ve galeriler-arası araç paylaşımı modüllerini kurdum; ürün kapsamını ve teknik önceliklendirmeyi yönlendirdim.",
			"body_en":        "Designed and built the multi-tenant, role-based architecture on Django REST Framework, PostgreSQL/PostGIS, Redis and Celery. Shipped the vehicle, CRM, document, expense, reporting and cross-dealer inventory-sharing modules, and drove product scope and technical prioritization.",
			"outcome_tr":     "Galerion'un ana mühendisi olarak çekirdek mimariden kritik modüllere kadar sahiplendim.",
			"outcome_en":     "Owned Galerion end-to-end as primary engineer, from core architecture to the key modules.",
			"tech_stack":     []string{"Django", "DRF", "PostgreSQL", "PostGIS", "Redis", "Celery", "React", "Docker"},
			"domains":        []string{"otomotiv"},
			"category":       "professional", "employer": "Everion", "year": "2025",
			"live_url":       "https://galerion.com.tr",
		}},
		{"hasarlink", map[string]any{
			"featured":       true,
			"name_tr":        "HasarLink", "name_en": "HasarLink",
			"description_tr": "Oto hasar onarım uzmanları ve servisler için operasyon platformu.",
			"description_en": "Operations platform for auto damage repair specialists and service centers.",
			"role_tr":        "Ana mühendis — altyapı & migration", "role_en": "Primary engineer — infrastructure & migration",
			"body_tr":        "Platformu DigitalOcean'dan dedicated VM'e taşıdım ve 11 konteynerlik Docker Compose mimarisi tasarladım (Django ASGI, Celery worker'ları, Redis, PostgreSQL, WebSocket destekli Nginx). Hasar dosyası oluşturma, belge yükleme, takip, bildirim, ödeme ve değer kaybı hesaplarını kapsayan uçtan uca iş akışlarını; servis, eksper, saha ve yönetici rolleri için dashboard, onay-revizyon akışları ve web push bildirimlerini geliştirdim.",
			"body_en":        "Led the migration from DigitalOcean to a dedicated VM and designed an 11-container Docker Compose architecture (Django ASGI, Celery workers, Redis, PostgreSQL, Nginx with WebSocket support). Built end-to-end damage-case workflows — creation, document upload, tracking, notifications, payments and depreciation — plus dashboards, approval/revision flows and web push for service, expert, field and manager roles.",
			"outcome_tr":     "Tek dedicated sunucuda, gerçek zamanlı bildirimli, çok rollü bir production sistemi. Play Store'da yayında.",
			"outcome_en":     "A real-time, multi-role production system on a single dedicated server. Shipped on Google Play.",
			"tech_stack":     []string{"Django", "DRF", "PostgreSQL", "React", "Vite", "Web Push", "Nginx", "Celery", "Redis", "Docker"},
			"domains":        []string{"sigorta", "otomotiv"},
			"category":       "professional", "employer": "Everion", "year": "2025",
			"live_url":       "https://web.hasarlink.com",
		}},
		{"doc-ai", map[string]any{
			"featured":       true,
			"name_tr":        "Doc AI", "name_en": "Doc AI",
			"description_tr": "Belgelerden yapılandırılmış veri çıkarıp ürünlerde form doldurmayı otomatikleştiren yapay zekâ servisi.",
			"description_en": "AI service that extracts structured data from documents to automate form-filling across products.",
			"role_tr":        "Tek başına, uçtan uca", "role_en": "Solo, end-to-end",
			"body_tr":        "Doc AI'ı tek başıma tasarlayıp geliştirdim: belge alımı, sınıflandırma, çoklu dosya analizi, yapılandırılmış JSON çıktı, hata yönetimi ve production entegrasyonları. Google Gemini API ile ruhsat, kimlik, kaza tutanağı, sigorta poliçesi, fatura ve kartvizitlerden yapılandırılmış veri çıkardım.",
			"body_en":        "Designed and built Doc AI solo — ingestion, classification, multi-file analysis, structured JSON output, error handling and production integration. Used the Google Gemini API to extract structured data from vehicle registrations, IDs, accident reports, insurance policies, invoices and business cards.",
			"outcome_tr":     "HasarLink ve QRakter'e entegre edilerek yüklenen belgelerden otomatik form doldurma sağladı ve manuel veri girişini belirgin ölçüde azalttı.",
			"outcome_en":     "Integrated into HasarLink and QRakter to auto-fill forms from uploaded documents, cutting manual data entry significantly.",
			"tech_stack":     []string{"Django", "DRF", "Celery", "Redis", "Google Gemini API", "PostgreSQL"},
			"domains":        []string{"ai", "sigorta"},
			"category":       "professional", "employer": "Everion", "year": "2025",
		}},
		{"qrakter", map[string]any{
			"featured":       true,
			"name_tr":        "Zayfix QRakter", "name_en": "Zayfix QRakter",
			"description_tr": "Kaza anı destek, dijital tutanak ve QR tabanlı araç/doküman yönetimi için mobil platform.",
			"description_en": "Mobile platform for accident-time assistance, digital reporting and QR-based vehicle/document management.",
			"role_tr":        "Mobil + backend; yayın & ödeme sahipliği", "role_en": "Mobile + backend; release & payments ownership",
			"body_tr":        "Mobil ve backend'de kaza bildirimi, araç, sigorta, doküman, imza, QR ve filo modüllerini geliştirdim; GPS check-in/out, offline senkronizasyon ve gerçek zamanlı konum takibi kurdum. KVKK uyumu ve güvenlik tarafında OTP, CORS, token yönetimi ve hassas veri akışları üzerinde çalıştım.",
			"body_en":        "Built accident-reporting, vehicle, insurance, document, signature, QR and fleet modules across mobile and backend; implemented GPS check-in/out, offline sync and real-time location tracking. Handled KVKK compliance and security — OTP, CORS, token management and sensitive-data flows.",
			"outcome_tr":     "React Native ile Play Store'da yayında. App Store/Google Play developer başvurularını, store submission'ı ve iyzico ödeme onboarding'ini de ben yürüttüm.",
			"outcome_en":     "Shipped on Google Play with React Native. I also ran the App Store/Google Play developer applications, store submission and iyzico payment onboarding.",
			"tech_stack":     []string{"Django", "DRF", "PostgreSQL", "Redis", "Celery", "React Native", "Expo"},
			"domains":        []string{"mobil", "otomotiv"},
			"category":       "professional", "employer": "Everion", "year": "2025",
			"live_url":       "https://qrakter.zayfix.com",
		}},
		{"tazminat-makinesi", map[string]any{
			"featured":       true,
			"name_tr":        "Tazminat Makinesi", "name_en": "Tazminat Makinesi",
			"description_tr": "Türkiye'de trafik ve iş kazası tazminatları için bağımsız aktüeryal hesaplama motoru.",
			"description_en": "Independent actuarial compensation engine for Turkish traffic and workplace-accident claims.",
			"role_tr":        "Bağımsız — uçtan uca tek başına", "role_en": "Independent — solo, end-to-end",
			"body_tr":        "Ürünü tek başıma uçtan uca kurdum: backend mimarisi, aktüeryal veri modelleme, deployment ve teknik SEO/GEO. Aktüeryal hesap mantığını referans çıktılar, yaşam tabloları ve alan kurallarıyla yeniden oluşturup doğruladım; TRH-2010 ve PMF-1931 yaşam tabloları, asgari ücret geçmişi ve 2-2-1-1 destek payı modeliyle yaralanma ve ölüm hesabı modüllerini geliştirdim.",
			"body_en":        "Built the product solo end-to-end — backend architecture, actuarial data modeling, deployment and technical SEO/GEO. Reconstructed and validated the actuarial logic against reference outputs, life tables and domain rules; implemented injury and fatality modules using the TRH-2010 and PMF-1931 life tables, minimum-wage history and the 2-2-1-1 support-share model.",
			"outcome_tr":     "Canlı ve public: tanımadığım, regüle bir domaini tek başıma çalışan bir ürüne çevirdim.",
			"outcome_en":     "Live and public — an unfamiliar, regulated domain turned into a working product, solo.",
			"tech_stack":     []string{"Python", "Django", "PostgreSQL", "SEO/GEO"},
			"domains":        []string{"sigorta", "hukuk"},
			"category":       "personal", "employer": "", "year": "2025",
			"live_url":       "https://tazminatmakinesi.com",
		}},
		{"notification-kit", map[string]any{
			"name_tr":        "Notification Kit", "name_en": "Notification Kit",
			"description_tr": "Django projeleri için açık kaynak, çok sağlayıcılı bildirim kütüphanesi (SMS / e-posta / push).",
			"description_en": "Open-source, multi-provider notification library for Django (SMS / email / push).",
			"outcome_tr":     "PyPI'da yayında; birden çok production projesinde kullanılıyor.",
			"outcome_en":     "Published on PyPI; used across multiple production projects.",
			"tech_stack":     []string{"Python", "Django", "PyPI"},
			"domains":        []string{"devtools"},
			"category":       "open-source", "employer": "", "year": "2025",
			"open_source":    true,
		}},
		{"recruitment-api", map[string]any{
			"name_tr":        "Recruitment API", "name_en": "Recruitment API",
			"description_tr": "Production disiplininde tasarlanmış Django REST API — 54 test, %95 kapsam.",
			"description_en": "Production-minded Django REST API — 54 tests, 95% coverage.",
			"outcome_tr":     "Public repo; test ve kapsam disiplininin somut örneği.",
			"outcome_en":     "Public repository demonstrating test and coverage discipline.",
			"tech_stack":     []string{"Django", "DRF", "PostgreSQL", "pytest"},
			"domains":        []string{"devtools"},
			"category":       "open-source", "employer": "", "year": "2024",
			"open_source":    true,
		}},
		{"portfolio-site", map[string]any{
			"name_tr":        "Portfolyo (bu site)", "name_en": "Portfolio (this site)",
			"description_tr": "Şu an baktığın site — Go API + Next.js, kendi yazdığım admin CMS.",
			"description_en": "The site you're viewing — Go API + Next.js with a custom admin CMS.",
			"outcome_tr":     "Açık kaynak. İçerik tamamen Go REST API'den gelir; bcrypt auth, rate-limit ve güvenlik başlıklarıyla.",
			"outcome_en":     "Open source. Content served entirely from a Go REST API, with bcrypt auth, rate limiting and security headers.",
			"tech_stack":     []string{"Go", "chi", "SQLite", "Next.js", "TypeScript", "Docker"},
			"domains":        []string{"devtools"},
			"category":       "open-source", "employer": "", "year": "2026",
			"open_source":    true,
		}},
		{"arac-deger-kaybi", map[string]any{
			"name_tr":        "Araç Değer Kaybı", "name_en": "Vehicle Depreciation AI",
			"description_tr": "Geçmiş bilirkişi raporlarından öğrenerek araç değer kaybı değerlendirmesine yardımcı olan makine öğrenmesi sistemi.",
			"description_en": "ML system that assists vehicle depreciation assessment by learning from past expert reports.",
			"tech_stack":     []string{"Python", "Django", "Machine Learning"},
			"domains":        []string{"ai", "sigorta"},
			"category":       "professional", "employer": "Everion", "year": "2025",
		}},
		{"everion-marketing", map[string]any{
			"name_tr":        "Everion Marketing", "name_en": "Everion Marketing",
			"description_tr": "Saha ekipleri için konum tabanlı CRM — müşteri, ziyaret ve satış takibi.",
			"description_en": "Location-based CRM for field teams — customers, visits and sales tracking.",
			"tech_stack":     []string{"Django", "DRF", "React Native", "PostgreSQL"},
			"domains":        []string{"crm"},
			"category":       "professional", "employer": "Everion", "year": "2025",
		}},
		{"zayfix", map[string]any{
			"name_tr":        "Zayfix", "name_en": "Zayfix",
			"description_tr": "Ön dosya, sözleşmeli ve vekaletli dosya süreçlerini birleştiren evrak ve operasyon platformu.",
			"description_en": "Document and operations platform unifying pre-file, contracted and power-of-attorney case flows.",
			"tech_stack":     []string{"Django", "DRF", "React", "PostgreSQL"},
			"domains":        []string{"sigorta", "hukuk", "otomotiv"},
			"category":       "professional", "employer": "Everion", "year": "2025",
		}},
		{"koza", map[string]any{
			"name_tr":        "Koza", "name_en": "Koza",
			"description_tr": "Proje, görev, kanban, toplantı ve günlük planlamayı bir araya getiren ekip yönetim platformu.",
			"description_en": "Team-management platform bringing together projects, tasks, kanban, meetings and daily planning.",
			"tech_stack":     []string{"Django", "DRF", "React", "PostgreSQL"},
			"domains":        []string{},
			"category":       "professional", "employer": "Everion", "year": "2026",
		}},
		{"maritimeos", map[string]any{
			"name_tr":        "MaritimeOS", "name_en": "MaritimeOS",
			"description_tr": "Alan odaklı denizcilik operasyonları platformu — DDD, iş kuralları ve olay odaklı durum yönetimi.",
			"description_en": "Domain-driven maritime operations platform — DDD, business rules and event-oriented state.",
			"tech_stack":     []string{"Go", "PostgreSQL", "Next.js"},
			"domains":        []string{"denizcilik"},
			"category":       "personal", "employer": "", "year": "2026",
		}},
		{"anisivar", map[string]any{
			"name_tr":        "AnısıVar", "name_en": "AnısıVar",
			"description_tr": "Gerçek zamanlı izleyici etkileşim platformu — WebSocket altyapısı ve AI destekli içerik üretimi.",
			"description_en": "Real-time audience engagement platform — WebSocket infrastructure and AI-assisted content generation.",
			"tech_stack":     []string{"Django", "Channels", "Next.js", "Redis", "Celery"},
			"domains":        []string{},
			"category":       "personal", "employer": "", "year": "2025",
		}},
	}
	for i, p := range projects {
		if err := add("projects", p.slug, i+1, p.data); err != nil {
			return err
		}
	}

	experiences := []row{
		{"everion-lead", map[string]any{
			"role_tr":        "Kurucu Mühendis ve Teknik Lider", "role_en": "Founding Engineer & Technical Lead",
			"company":        "Everion Consulting",
			"description_tr": "Şirket genelinde teknik liderlik: mimari, production hazırlığı ve ürünler-arası mühendislik önceliklerinin sahibi. 12 kişilik ekibi koordine ederken backend, frontend/mobil, DevOps, test, güvenlik ve release'lerde hands-on kaldım; ~15 VM'de SSH güvenlik denetimi ve Docker tabanlı deployment pipeline'ları dahil altyapı ve güvenlik operasyonlarına liderlik ettim.",
			"description_en": "Company-wide technical leadership — owning architecture, production readiness and cross-product engineering priorities. Coordinated a 12-engineer team while staying hands-on across backend, frontend/mobile, DevOps, testing, security and releases; led infrastructure and security ops including an SSH audit across ~15 VMs and Docker-based deployment pipelines.",
			"tech_stack":     []string{"Django", "DRF", "PostgreSQL", "React", "React Native", "Docker"},
			"start_date":     "Apr 2026", "end_date": "Present",
		}},
		{"everion-engineer", map[string]any{
			"role_tr":        "Full-Stack ve Çözüm Mühendisi", "role_en": "Full-Stack & Solution Engineer",
			"company":        "Everion Consulting",
			"description_tr": "Otomotiv, sigorta, hukuk, İK, CRM ve yapay zekâ alanlarında 8+ SaaS üründe gereksinim analizinden production deployment'a kadar özellik geliştirip canlıya aldım. Python, DRF, PostgreSQL, Redis ve Celery ile REST API'ler, background task'ler ve iş akışları; React/React Native katkıları; sprint planlama ve müşteri geri bildirim döngüleri.",
			"description_en": "Shipped features across 8+ SaaS products (automotive, insurance, legal, HR, CRM, AI) from requirement analysis through production. Built REST APIs, background tasks and workflows with Python, DRF, PostgreSQL, Redis and Celery; contributed to React/React Native; ran sprint planning and customer feedback loops.",
			"tech_stack":     []string{"Python", "Django", "DRF", "PostgreSQL", "Redis", "Celery", "React", "React Native"},
			"start_date":     "Mar 2025", "end_date": "Apr 2026",
		}},
		{"eksioglu", map[string]any{
			"role_tr":        "Yazılım Mühendisi", "role_en": "Software Engineer",
			"company":        "Ekşioğlu Hukuk",
			"description_tr": "Dava yönetimi, sigorta/tahkim başvuruları, tahsilat ve saha operasyonlarını kapsayan iç hukuk yazılımında backend ve frontend geliştirdim; React ve Django ile dashboard, raporlama ve Excel/PDF export. Manuel iş akışlarını izlenebilir ve raporlanabilir sistemlere dönüştürdüm.",
			"description_en": "Built backend and frontend for internal legal software covering case management, insurance/arbitration filings, collections and field ops; dashboards, reporting and Excel/PDF export with React and Django. Turned manual workflows into trackable, reportable systems.",
			"tech_stack":     []string{"Django", "React", "PostgreSQL"},
			"start_date":     "Dec 2024", "end_date": "Mar 2025",
		}},
		{"skyland-intern", map[string]any{
			"role_tr":        "İş Analisti Stajyeri", "role_en": "Business Analyst Intern",
			"company":        "Skyland A.Ş.",
			"description_tr": "İş analizi dokümanları, kullanıcı senaryoları ve süreç akışları hazırladım; gereksinim analizi ve proje dokümantasyonu süreçlerine katkı verdim.",
			"description_en": "Prepared business analysis documents, user scenarios and process flows; contributed to requirement analysis and project documentation.",
			"tech_stack":     []string{},
			"start_date":     "Sep 2023", "end_date": "Feb 2024",
		}},
		{"ziraat-intern", map[string]any{
			"role_tr":        "Yazılım Mühendisliği Stajyeri", "role_en": "Software Engineering Intern",
			"company":        "Ziraat Teknoloji",
			"description_tr": "Kart Sistemleri ekibinde kurumsal yazılım geliştirme sürecinde görev aldım; ASP.NET, C#, Entity Framework ve MSSQL ile özellik geliştirdim.",
			"description_en": "Worked on enterprise software within the Card Systems team; built features with ASP.NET, C#, Entity Framework and MSSQL.",
			"tech_stack":     []string{"ASP.NET", "C#", "Entity Framework", "MSSQL"},
			"start_date":     "Jul 2023", "end_date": "Sep 2023",
		}},
	}
	for i, e := range experiences {
		if err := add("experiences", e.slug, i+1, e.data); err != nil {
			return err
		}
	}

	if err := add("education", "bahcesehir-university", 1, map[string]any{
		"school_tr": "Bahçeşehir Üniversitesi", "school_en": "Bahçeşehir University",
		"degree_tr": "Yazılım Mühendisliği Lisansı (İngilizce)", "degree_en": "B.Sc. Software Engineering (English)",
		"detail_tr": "%100 Burslu", "detail_en": "100% Scholarship",
		"start_date": "2020", "end_date": "2024",
	}); err != nil {
		return err
	}

	certs := []row{
		{"salesforce-admin", map[string]any{"name_tr": "Salesforce Certified Administrator", "name_en": "Salesforce Certified Administrator", "issuer": "Salesforce", "year": "", "description_tr": "Salesforce platformunda kullanıcı, güvenlik, otomasyon ve CRM yönetimi.", "description_en": "User, security, automation and CRM management on the Salesforce platform."}},
		{"salesforce-agentforce", map[string]any{"name_tr": "Salesforce Agentforce Specialist", "name_en": "Salesforce Agentforce Specialist", "issuer": "Salesforce", "year": "", "description_tr": "Yapay zekâ destekli Agentforce çözümlerinin tasarımı ve yönetimi.", "description_en": "Design and management of AI-powered Agentforce solutions."}},
		{"ibm-data-analyst", map[string]any{"name_tr": "IBM Data Analyst Professional", "name_en": "IBM Data Analyst Professional", "issuer": "IBM", "year": "", "description_tr": "Veri analizi, görselleştirme, SQL ve iş zekâsı.", "description_en": "Data analysis, visualization, SQL and business intelligence."}},
		{"miuul-data-scientist", map[string]any{"name_tr": "Miuul Data Scientist Path", "name_en": "Miuul Data Scientist Path", "issuer": "Miuul", "year": "", "description_tr": "Makine öğrenmesi, öneri sistemleri, CRM analitiği ve özellik mühendisliği.", "description_en": "Machine learning, recommendation systems, CRM analytics and feature engineering."}},
	}
	for i, c := range certs {
		if err := add("certifications", c.slug, i+1, c.data); err != nil {
			return err
		}
	}

	groups := []row{
		{"backend-api", map[string]any{"group_tr": "Backend & API", "group_en": "Backend & API", "items": []string{"Python", "Django", "Django REST Framework", "Go", "C#", "ASP.NET Core", "Celery"}}},
		{"frontend-mobile", map[string]any{"group_tr": "Frontend & Mobil", "group_en": "Frontend & Mobile", "items": []string{"TypeScript", "React", "Next.js", "React Native", "Expo", "Tailwind CSS"}}},
		{"data-architecture", map[string]any{"group_tr": "Veri & Mimari", "group_en": "Data & Architecture", "items": []string{"PostgreSQL", "PostGIS", "Redis", "MSSQL", "Multi-Tenancy", "RBAC", "Event-Driven Workflows"}}},
		{"platform-cloud", map[string]any{"group_tr": "Platform & Bulut", "group_en": "Platform & Cloud", "items": []string{"Docker", "GitHub Actions", "Nginx", "Linux", "DigitalOcean", "AWS S3", "Firebase"}}},
	}
	for i, g := range groups {
		if err := add("skills", g.slug, i+1, g.data); err != nil {
			return err
		}
	}

	socials := []row{
		{"email", map[string]any{"label_tr": "Email", "label_en": "Email", "url": "mailto:gokcenizguler@gmail.com"}},
		{"github", map[string]any{"label_tr": "GitHub", "label_en": "GitHub", "url": "https://github.com/gokcenizamoglu"}},
		{"linkedin", map[string]any{"label_tr": "LinkedIn", "label_en": "LinkedIn", "url": "https://linkedin.com/in/gokceguler"}},
	}
	for i, link := range socials {
		if err := add("socials", link.slug, i+1, link.data); err != nil {
			return err
		}
	}

	// CV documents are seeded by migration 002 (they are tied to the media/
	// localization schema step), so they are intentionally not duplicated here.

	return s.SetSettings(map[string]string{
		"name":              "Gökçe Güler",
		"title":             "Full-Stack Software Engineer",
		"title_tr":          "Full-Stack Yazılım Mühendisi",
		"title_en":          "Full-Stack Software Engineer",
		"tagline":           "I turn complex operations into reliable software systems.",
		"tagline_tr":        "Karmaşık operasyonları çalışan, güvenilir yazılım sistemlerine dönüştürüyorum.",
		"tagline_en":        "I turn complex operations into reliable software systems.",
		"about_lead_tr":     "Erken aşama bir teknoloji şirketinde kurucu mühendis: bir fikri, yalnızca ekranda değil production'da yaşayan bir sisteme dönüştürüyorum.",
		"about_lead_en":     "A founding-stage engineer at an early tech company: I turn an idea into a system that lives in production, not just on screen.",
		"about_body_tr":     "Everion'un kuruluş sürecinden itibaren mimari, ürün geliştirme, production altyapısı, uygulama güvenliği ve teknik liderlikte sorumluluk aldım. Otomotivden sigortaya, hukuktan İK, CRM ve yapay zekâ destekli belge işlemeye uzanan 8+ SaaS ürün — kimileri ekip ürünü, kimileri uçtan uca tek başıma. Kod kadar yayına almayı da sahiplendim: App Store/Google Play developer başvuruları, store submission ve iyzico ödeme onboarding'i bana ait. Salesforce Administrator ve Agentforce tarafındaki deneyimim, işi koddan önce süreç ve platform olarak düşünme alışkanlığı kazandırdı.",
		"about_body_en":     "From Everion's earliest days I've owned architecture, product development, production infrastructure, application security and technical leadership. Across 8+ SaaS products spanning automotive, insurance, legal, HR, CRM and AI-assisted document processing — some as a team product, some solo end-to-end. I own shipping as much as code: App Store/Google Play developer applications, store submissions and iyzico payment onboarding were mine. My Salesforce Administrator and Agentforce work taught me to think in processes and platforms before code.",
		"availability_tr":   "İyi ürünler ve özenli mühendislik konuşmalarına her zaman açığım.",
		"availability_en":   "Always open to conversations about good products and careful engineering.",
		"location":          "Istanbul, Türkiye",
		"seo_description":   "Portfolio of Gökçe Güler, Full-Stack Software Engineer.",
		"logo_mark_url":     "/brand/yazısız.png",
		"logo_wordmark_url": "/brand/ggu.png",
	})
}
