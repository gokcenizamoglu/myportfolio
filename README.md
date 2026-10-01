# Gökçe Güler — Portfolio

Production portfolio and content-management system for [gokceguler.com](https://gokceguler.com). The project combines a bilingual Next.js frontend with a Go API, a protected administration interface, SQLite-backed content, privacy-conscious analytics, and automated deployment.

## Product capabilities

### Bilingual portfolio

- Dedicated Turkish and English routes with localized navigation, biography, experience, project, education, certification, and contact content
- Featured-project presentation, additional-work listings, project detail routes, and animated project previews
- Responsive, keyboard-accessible navigation with reduced-motion support
- Downloadable localized CVs and certificate attachments
- Graceful API-offline and not-found states

### Content management

- Authenticated administration interface for projects, experience, education, certifications, skills, social links, documents, and global site settings
- Create, edit, delete, publish, hide, feature, search, filter, and reorder content without changing source code
- Side-by-side Turkish and English editing with shared structured fields
- Image and PDF uploads with previews, size limits, extension allowlists, content sniffing, and randomized storage names
- Live project-card previews and Google-result previews while editing
- Content-health scoring with missing-field checks, severity levels, per-language recommendations, and direct links to affected records

### Privacy-conscious analytics

- First-party tracking for page views, section views, project opens, and CV downloads
- Seven- and 30-day dashboard views with unique visitors, daily traffic, language distribution, most-viewed projects, and engagement totals
- Daily rotating visitor identifiers derived from a server-side secret; raw IP addresses are not stored
- Localhost and common bot traffic excluded from reporting
- Automatic deletion of analytics records older than 90 days

### Review-first CV import

- Turkish or English PDF upload with structured extraction through Google Gemini
- Matching against existing experience, education, certification, skill, project, and site-text records
- Field-level before/after diffs that can be accepted, edited, or skipped individually
- New-record creation, matched-record updates, and explicit handling of records missing from the uploaded CV
- Existing records are preserved by default; deletion requires a separate selection and confirmation
- No extracted change is written to the database until the administrator approves and applies it

### SEO and discovery

- Dynamic localized metadata and configurable SEO titles and descriptions
- Canonical URLs plus `tr`, `en`, and `x-default` language alternates
- Dynamic sitemap containing visible projects only
- Configurable robots policy for standard crawlers, OAI-SearchBot, and GPTBot
- Generated Open Graph imagery and Twitter card metadata
- `ProfilePage`, `Person`, and project-level structured data through JSON-LD

### Delivery and operations

- Automated backend tests and vetting plus frontend linting, type checking, tests, and production builds
- GitHub Actions deployment to a Linux host after changes reach `main`
- Docker Compose services for Caddy, Next.js, and the Go API
- Automatic HTTPS, HTTP/3 support, persistent application data, health checks, and documented backup procedures

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
