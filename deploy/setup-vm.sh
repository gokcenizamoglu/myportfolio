#!/usr/bin/env bash
# Provision a fresh Ubuntu/Debian VM (e.g. GCP e2-micro): swap + Docker.
# Run ONCE, with sudo:   sudo bash deploy/setup-vm.sh
# After it finishes, LOG OUT and back in (or run: newgrp docker) so your
# user picks up docker-group membership, then run deploy/deploy.sh.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo bash deploy/setup-vm.sh" >&2
  exit 1
fi

TARGET_USER="${SUDO_USER:-$(logname 2>/dev/null || echo root)}"

# --- 1. Swap (critical on 1GB e2-micro so `next build` doesn't OOM) ---------
if swapon --show | grep -q .; then
  echo "[swap] already present, skipping."
else
  echo "[swap] creating 2G /swapfile ..."
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Prefer RAM, use swap only under real pressure.
  sysctl -w vm.swappiness=10 >/dev/null
  grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
  echo "[swap] done."
fi

# --- 2. Docker Engine + Compose plugin --------------------------------------
if command -v docker >/dev/null 2>&1; then
  echo "[docker] already installed, skipping."
else
  echo "[docker] installing via get.docker.com ..."
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker

# --- 3. Let the login user run docker without sudo --------------------------
if [ "$TARGET_USER" != "root" ]; then
  usermod -aG docker "$TARGET_USER"
  echo "[docker] added '$TARGET_USER' to the docker group."
fi

echo
echo "=========================================================="
echo " Setup complete."
echo " LOG OUT and back in (or run: newgrp docker), then:"
echo "   cd <repo> && bash deploy/deploy.sh"
echo "=========================================================="
