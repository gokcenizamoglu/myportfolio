# Gökçe Güler — Portfolio

Production portfolio and content-management system for [gokceguler.com](https://gokceguler.com). The project combines a bilingual Next.js frontend with a Go API, a protected administration interface, SQLite-backed content, privacy-conscious analytics, and automated deployment.

## Highlights

- Turkish and English portfolio routes with localized content and project pages
- Admin interface for projects, experience, education, certifications, skills, documents, media, and site settings
- Secure PDF and image uploads with content-type validation
- Review-first CV import workflow powered by Google Gemini
- First-party analytics with anonymous, rotating visitor identifiers and 90-day retention
- Dynamic metadata, canonical URLs, language alternates, sitemap, robots policy, Open Graph imagery, and JSON-LD
- Automated tests, linting, type checking, production builds, and deployment through GitHub Actions
- Docker Compose production stack with Caddy-managed HTTPS

## Architecture

```text
Browser
  └─ Caddy (HTTPS and path routing)
      ├─ Next.js frontend
      │   ├─ /tr and /en portfolio routes
      │   └─ /admin content-management interface
      └─ Go REST API
          ├─ SQLite content and analytics
          ├─ uploaded media and documents
          └─ optional Gemini CV analysis
```

The production deployment uses same-origin routing: Caddy sends application pages to Next.js and API requests to the Go service. SQLite data and uploaded media live in a persistent Docker volume.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Go 1.23, chi, sqlx |
| Data | SQLite, versioned SQL migrations |
| Infrastructure | Docker Compose, Caddy, GitHub Actions |
| Integrations | Google Gemini API, Open Graph, JSON-LD |

## Repository structure

```text
portfolio/
├── backend/                 # Go API, migrations, validation, and tests
├── frontend/                # Next.js site, admin interface, and assets
├── deploy/                  # VM provisioning and deployment scripts
├── .github/workflows/       # CI and production deployment
├── Caddyfile                # HTTPS and reverse-proxy configuration
├── docker-compose.yml       # local container stack
└── docker-compose.prod.yml  # production stack
```

## Local development

### Backend

Requirements: Go 1.23 or newer.

```bash
cd backend
cp .env.example .env
go mod download
go run ./cmd/server --seed --create-admin="admin:replace-with-a-long-password"
```

The API starts at `http://localhost:8080`. Its health endpoint is available at `/healthz`, and public portfolio data at `/api/v1/portfolio`.

### Frontend

Requirements: Node.js 20 or newer.

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Open:

- `http://localhost:3000/tr` — Turkish portfolio
- `http://localhost:3000/en` — English portfolio
- `http://localhost:3000/admin` — administration interface

## Quality checks

```bash
# Backend
cd backend
go vet ./...
go test ./...

# Frontend
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
```

The CI workflow runs the backend and frontend checks on every push to `main` and on pull requests.

## Production deployment

Production runs on a single Linux host with Caddy, Next.js, the Go API, and persistent Docker volumes. Pushes to `main` trigger the deployment workflow, which connects to the host over SSH and runs the checked-in deployment script.

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for initial provisioning, environment configuration, backups, logs, and recovery commands.

## Security and privacy

- Admin passwords are hashed with bcrypt.
- Session tokens are random, stored as SHA-256 hashes, and delivered through HttpOnly cookies.
- Login attempts are rate-limited by client IP.
- Uploads are size-limited and validated using both file extension and detected content type.
- SVG uploads are rejected to avoid stored-XSS risks.
- SQL queries are parameterized and API inputs are validated against allowlists and length limits.
- Analytics identifiers are derived from a server-side secret, rotate daily, and are retained for 90 days.
- CV files are sent to Google Gemini only when an administrator explicitly starts an import; leaving `GEMINI_API_KEY` empty disables the feature.

Secrets and runtime data are intentionally excluded from Git. Use the checked-in `.env.example` files as configuration references.
