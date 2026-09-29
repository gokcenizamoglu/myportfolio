# Gökçe Güler Portfolio

Next.js + Go ile hazırlanmış, içerikleri tamamen REST API'den gelen portfolyo monoreposu. Tasarım, kökteki `index.html` referansının sıcak fildişi paletini, koyu geometrik navigasyonunu ve editoryal tipografisini korur.

## Yapı

```text
portfolio/
├── frontend/                 # Next.js 15, TypeScript, Tailwind, Motion
│   ├── app/                  # public site + /admin
│   ├── components/
│   └── public/brand/         # iki logo varyasyonu
├── backend/                  # Go REST API
│   ├── cmd/server/
│   └── internal/
│       ├── handler/
│       ├── middleware/
│       ├── model/
│       └── store/migrations/
├── .github/workflows/ci.yml
├── docker-compose.yml
└── index.html                # orijinal tasarım referansı
```

## Özellikler

- Public API: projects, experiences, education, certifications, skills, contact/social links, indirilebilir belgeler ve site settings.
- `/admin`: tüm içerik tipleri için oluşturma, listeleme, düzenleme, görünürlük ve silme.
- `/tr` ve `/en`: URL tabanlı Türkçe/İngilizce deneyim. Yönetim panelindeki iki dilli alanlar aynı içeriğin iki karşılığını tutar.
- Admin medya yükleme: iki logo, dört ana menü görseli, CV, sertifika ve ek dosyalar. Desteklenen türler PNG, JPG, WEBP ve PDF; üst sınır 16 MB. Uzantı yeterli değil — dosyanın gerçek içeriği sniff edilip uzantısıyla eşleşmezse reddedilir.
- Auth: bcrypt parola, rastgele 256-bit oturum anahtarı, veritabanında yalnızca SHA-256 hash, HttpOnly/SameSite cookie.
- SQLite WAL, sıralı ve geri alınabilir SQL migration dosyaları.
- Next.js public sayfasında API dışı portfolyo içeriği yoktur; API kapalıysa açık bir durum ekranı gösterilir.
- Responsive tasarım ve Framer Motion giriş animasyonları.

## Yerel geliştirme

### 1. Backend

Go 1.23+ gerekir.

```bash
cd backend
cp .env.example .env
go mod tidy
go run ./cmd/server --seed
go run ./cmd/server --create-admin="admin:en-az-12-karakter-parola"
go run ./cmd/server
```

İlk iki komut aynı veritabanı yolunu kullanır. Varsayılan adres `http://localhost:8080`; health check `/healthz`, public içerik `/api/v1/portfolio`.

Testler ve statik kontrol:

```bash
go test ./...
go vet ./...
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Türkçe site `http://localhost:3000/tr`, İngilizce site `http://localhost:3000/en`, admin `http://localhost:3000/admin` adresindedir.

Admin panelindeki **Site ve marka** bölümünden küçük logo ile ana “Gökçe Güler” logosu ayrı ayrı yüklenebilir. Aynı bölümde Boots4 düzenindeki dört navigasyon kutusunun arka plan görselleri yönetilir. **Ekler ve CV** bölümünden yeni CV, portfolyo eki veya PDF eklenebilir; sertifika kayıtlarının kendi dosya alanı da vardır.

## API özeti

| Method | Endpoint | Amaç |
|---|---|---|
| GET | `/api/v1/portfolio` | Yayındaki tüm portfolyo içeriği |
| POST | `/api/v1/admin/login` | Admin oturumu aç |
| POST | `/api/v1/admin/logout` | Oturumu kapat |
| POST | `/api/v1/admin/media` | Logo, görsel veya PDF yükle |
| GET/POST | `/api/v1/admin/content/{kind}` | Listele / oluştur |
| PUT/DELETE | `/api/v1/admin/content/{kind}/{id}` | Güncelle / sil |
| GET/PUT | `/api/v1/admin/settings` | Site ayarlarını listele / ekle-güncelle |
| DELETE | `/api/v1/admin/settings/{key}` | Bir site ayarını sil |

`kind`: `projects`, `experiences`, `education`, `certifications`, `skills`, `socials`, `documents`.

## Güvenlik

Backend küçük ama saldırı yüzeyi ciddiye alınarak kuruldu:

- **Parola & oturum:** bcrypt hash, en az 12 karakterlik admin parolası zorunlu. Oturum anahtarı 256-bit rastgele; veritabanında yalnızca SHA-256 hash tutulur, sızan bir satır doğrudan replay edilemez. Cookie HttpOnly + SameSite=Lax, production'da Secure.
- **Brute-force:** login endpoint'i IP başına dakikada 8 denemeyle sınırlı (bağımlılıksız, in-memory sliding window).
- **Kullanıcı enumeration:** olmayan kullanıcıda da dummy bir bcrypt karşılaştırması yapılır; yanıt süresi geçerli/geçersiz kullanıcıyı ele vermez.
- **Girdi doğrulama:** tüm istek gövdelerinde boyut sınırı, slug ve setting-key regex doğrulaması, `kind` allowlist'i, parametreli SQL (injection yok).
- **Upload:** uzantı allowlist'i + gerçek içerik sniff + rastgele isim + `O_EXCL`; SVG kabul edilmez (stored-XSS vektörü). Servis tarafında `filepath.Base` ile path traversal koruması, `X-Content-Type-Options: nosniff`.
- **HTTP başlıkları:** `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-site` global uygulanır.
- **Sunucu:** tüm read/write/idle timeout'ları set, panic recovery, CORS yalnızca yapılandırılan origin'lere açık.

> Not: rate limiter, chi `RealIP` middleware'inin çözdüğü istemci IP'sine güvenir; production'da güvenilir bir reverse proxy arkasında çalıştırılmalıdır.

## Ortam değişkenleri

Backend: `PORT`, `APP_ENV`, `DATABASE_PATH`, `CORS_ORIGINS`.

Frontend: `API_URL` sunucu tarafı erişimi, `NEXT_PUBLIC_API_URL` tarayıcı/admin erişimi için kullanılır. Production ortamında ikisini de gerçek HTTPS adreslerine göre ayarlayın.

## CI ve yayın planı

CI her push/PR'da frontend typecheck + production build; backend vet + test + build çalıştırır. Sonraki yayın aşamasında Docker image'ları registry'ye gönderilip staging health check'i ardından production deploy yapılabilir. Production'da TLS reverse proxy, yedeklenen kalıcı volume ve yalnızca frontend origin'ine izin veren CORS ayarı kullanılmalıdır.

## Marka varlıkları

Yüklenen iki ayrı logo dosyası çalışma alanında bulunamadığı için `design-prompt.md` içindeki tarif temel alınarak iki SVG rekonstrüksiyonu oluşturuldu. Orijinal dosyalar elde edildiğinde aynı adlarla `frontend/public/brand/logo-script.svg` ve `logo-wordmark.svg` üzerine konularak kod değişmeden kullanılabilir.
