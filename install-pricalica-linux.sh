#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 2 ]]; then
  cat <<'EOF'
Usage:
  sudo ./install-pricalica-linux.sh <domain> <email>

Example:
  sudo ./install-pricalica-linux.sh pricalica.example.com admin@example.com

Notes:
  - domain mora vec pokazivati na ovaj server
  - skripta je namijenjena za Ubuntu/Debian
  - aplikacija ce raditi iza Nginxa na portu 80 i 443
EOF
  exit 1
fi

DOMAIN="$1"
EMAIL="$2"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_NAME="pricalica-network"
NGINX_CONF="/etc/nginx/sites-available/pricalica"
NGINX_LINK="/etc/nginx/sites-enabled/pricalica"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "Pokreni skriptu sa sudo ili kao root."
    exit 1
  fi
}

install_packages() {
  log "Instaliram Docker, Nginx i Certbot"
  apt-get update
  apt-get install -y ca-certificates curl gnupg lsb-release nginx certbot python3-certbot-nginx

  if ! command -v docker >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${VERSION_CODENAME}") stable
EOF

    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  fi

  systemctl enable --now docker
  systemctl enable --now nginx
}

ensure_network() {
  if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    log "Kreiram Docker mrezu $NETWORK_NAME"
    docker network create "$NETWORK_NAME" >/dev/null
  fi
}

start_stack() {
  log "Podizem bazu"
  (
    cd "$ROOT_DIR/PricalicaDB"
    docker compose up -d
  )

  log "Cekam da se MySQL inicijalizira"
  sleep 15

  log "Podizem API"
  (
    cd "$ROOT_DIR/PricalicaAPI"
    docker compose up --build -d app
  )

  log "Podizem music service"
  (
    cd "$ROOT_DIR/Pricalica-music-service"
    docker compose up --build -d
  )

  log "Podizem web aplikaciju"
  (
    cd "$ROOT_DIR/PricalicaWebApp/pricalicaWebApp"
    export VITE_API_BASE_URL="https://${DOMAIN}/api"
    docker compose up --build -d
  )

  log "Cekam da se web aplikacija podigne"
  sleep 20
}

write_nginx_config() {
  log "Slazem Nginx konfiguraciju za domenu $DOMAIN"

  cat >"$NGINX_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /music/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  ln -sf "$NGINX_CONF" "$NGINX_LINK"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx
}

request_ssl() {
  log "Pokusavam izdati Let's Encrypt certifikat za $DOMAIN"
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect
}

print_done() {
  cat <<EOF

Instalacija zavrsena.

Otvorene adrese:
  http://$DOMAIN
  https://$DOMAIN

Servisi u pozadini:
  DB   -> localhost:3306
  API  -> localhost:3000
  MUSIC -> localhost:5000
  WEB  -> localhost:9000

Javni pristup ide preko Nginxa na portu 80/443.
EOF
}

require_root
install_packages
ensure_network
start_stack
write_nginx_config
request_ssl
print_done
