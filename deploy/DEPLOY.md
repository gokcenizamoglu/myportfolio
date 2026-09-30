# Deployment (single free VM)

One host runs everything with Docker Compose: Caddy (auto HTTPS) in front of
the Next.js frontend and the Go API, with SQLite + uploads on a persistent
volume. Works on any small Linux VM (GCP e2-micro, Oracle, AWS/Azure micro).

## 0. Prerequisites
- A VM running Ubuntu/Debian with a public IP.
- A domain whose DNS **A record points to the VM's IP** (set this before
  deploying — Caddy needs it to issue the TLS certificate).
- SSH access to the VM.

## 1. Get the code onto the VM
```bash
git clone <your-repo-url> portfolio
cd portfolio
```
> `backend/data/` is gitignored, so your database and uploads are NOT in the
> repo — you transfer them separately in step 3.

## 2. Provision the VM (once)
```bash
sudo bash deploy/setup-vm.sh
```
Adds a 2 GB swapfile (so `next build` doesn't run out of memory on 1 GB
machines) and installs Docker. **Then log out and back in** (or `newgrp docker`)
so your user can run Docker without sudo.

## 3. Move your existing database + uploads to the VM  (first deploy only)
On your **local Windows machine** (Git Bash or PowerShell with OpenSSH),
copy your live DB and media into a `seed-data/` folder on the VM. Copy the
`-wal`/`-shm` files too if they exist, so no un-checkpointed data is lost:

```bash
scp backend/data/portfolio.db \
    backend/data/portfolio.db-wal \
    backend/data/portfolio.db-shm \
    USER@VM_IP:~/portfolio/seed-data/
scp -r backend/data/uploads USER@VM_IP:~/portfolio/seed-data/
```
(The `-wal`/`-shm` files may not exist — that's fine, drop them from the command.)

`deploy.sh` will load `seed-data/` into the volume automatically on first run,
and will **refuse to overwrite** an existing database on later runs.

## 4. Configure secrets
```bash
cp .env.prod.example .env.prod
nano .env.prod    # set DOMAIN, ACME_EMAIL, and GEMINI_API_KEY (if using CV import)
```

## 5. Deploy
```bash
bash deploy/deploy.sh
```
Builds the images, seeds the DB (first run), and starts everything. Watch it
come up:
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f caddy api web
```
Visit `https://<DOMAIN>` and `https://<DOMAIN>/healthz`.

## Everyday operations
Set an alias to save typing:
```bash
alias dc='docker compose --env-file .env.prod -f docker-compose.prod.yml'
```
| Task | Command |
|------|---------|
| Update after `git pull` | `bash deploy/deploy.sh` |
| Logs | `dc logs -f api` |
| Restart one service | `dc restart api` |
| Stop everything | `dc down` |
| Back up the DB | `dc cp api:/data/portfolio.db ./backup-$(date +%F).db` |
| Re-seed (overwrite DB!) | `FORCE=1 bash deploy/deploy.sh` |

## Notes
- **Firewall**: allow inbound 80 and 443 (GCP: create a firewall rule or use
  the "Allow HTTP/HTTPS traffic" tags; Oracle: add ingress rules to the
  security list). Port 22 for SSH.
- **Certificates persist** in the `caddy_data` volume; don't delete it.
- **Data persists** in the `portfolio_data` volume; `dc down` keeps it,
  `dc down -v` would DELETE it.
- Admin login uses a user stored in the DB (bcrypt). If you start from an
  empty DB instead of seeding, you won't have an admin account.
