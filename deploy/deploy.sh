#!/usr/bin/env bash
# Build images, seed the DB on first run, and bring the stack up.
# Safe to re-run: it will NOT overwrite an existing database.
#   bash deploy/deploy.sh
#
# First deploy only: put your local data in ./seed-data/ beforehand
# (portfolio.db [+ -wal/-shm] and the uploads/ folder). See deploy/DEPLOY.md.
set -euo pipefail

cd "$(dirname "$0")/.."   # repo root

if [ ! -f .env.prod ]; then
  echo "ERROR: .env.prod not found. Create it first:" >&2
  echo "  cp .env.prod.example .env.prod   # then fill DOMAIN, ACME_EMAIL, GEMINI_API_KEY" >&2
  exit 1
fi

COMPOSE="docker compose --env-file .env.prod -f docker-compose.prod.yml"

echo "[build] building images (this is the RAM-heavy step) ..."
$COMPOSE build

# --- Seed the DB + uploads on first run only --------------------------------
# Uses a throwaway container that mounts the same portfolio_data volume, so it
# works regardless of the compose project/volume name.
if [ -f ./seed-data/portfolio.db ]; then
  echo "[seed] seed-data/ found, checking volume ..."
  # Run as root so we can read the host seed files regardless of their
  # permissions, then hand ownership back to the app user.
  $COMPOSE run --rm --no-deps --user root -e FORCE="${FORCE:-}" \
    --entrypoint sh -v "$(cd ./seed-data && pwd):/seed:ro" api -c '
      set -e
      if [ -f /data/portfolio.db ] && [ -z "$FORCE" ]; then
        echo "[seed] /data/portfolio.db already exists -> skipping (run FORCE=1 bash deploy/deploy.sh to overwrite)."
        exit 0
      fi
      rm -f /data/portfolio.db /data/portfolio.db-wal /data/portfolio.db-shm
      cp /seed/portfolio.db /data/portfolio.db
      [ -f /seed/portfolio.db-wal ] && cp /seed/portfolio.db-wal /data/ || true
      [ -f /seed/portfolio.db-shm ] && cp /seed/portfolio.db-shm /data/ || true
      mkdir -p /data/uploads
      [ -d /seed/uploads ] && cp -a /seed/uploads/. /data/uploads/ || true
      chown -R app /data
      echo "[seed] DB + uploads loaded into volume."
    '
else
  echo "[seed] no ./seed-data/portfolio.db -> skipping (fresh empty DB will be created)."
fi

echo "[up] starting stack ..."
$COMPOSE up -d

echo
$COMPOSE ps
echo
echo "Done. Watch TLS provisioning + startup logs with:"
echo "  $COMPOSE logs -f caddy api web"
echo "Then open your site. Health check: https://<DOMAIN>/healthz"
