#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_NAME="${NETWORK_NAME:-pricalica-network}"
RUN_E2E=false
ACTION="up"

print_usage() {
  cat <<'EOF'
Usage:
  ./deploy-pricalica.sh [up|down|restart|status] [--with-e2e]

Examples:
  ./deploy-pricalica.sh
  ./deploy-pricalica.sh up --with-e2e
  ./deploy-pricalica.sh restart
  ./deploy-pricalica.sh down

Options:
  --with-e2e    After services start, run Playwright E2E tests
EOF
}

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$1"
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Nedostaje naredba: $command_name"
    exit 1
  fi
}

compose_run() {
  local service_dir="$1"
  shift

  (
    cd "$ROOT_DIR/$service_dir"
    docker compose "$@"
  )
}

ensure_network() {
  if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    log "Kreiram Docker mrezu $NETWORK_NAME"
    docker network create "$NETWORK_NAME" >/dev/null
  else
    log "Docker mreza $NETWORK_NAME vec postoji"
  fi
}

wait_seconds() {
  local seconds="$1"
  local message="$2"

  log "$message ($seconds s)"
  sleep "$seconds"
}

start_stack() {
  ensure_network

  log "Podizem PricalicaDB"
  compose_run "PricalicaDB" up -d
  wait_seconds 15 "Cekam da se MySQL inicijalizira"

  log "Podizem PricalicaAPI"
  compose_run "PricalicaAPI" up --build -d app
  wait_seconds 10 "Cekam da se API podigne"

  log "Podizem PricalicaWebApp"
  compose_run "PricalicaWebApp/pricalicaWebApp" up --build -d
  wait_seconds 20 "Cekam da se web aplikacija podigne"

  log "Deploy zavrsen"
  echo "DB:  localhost:3306"
  echo "API: http://localhost:3000"
  echo "WEB: http://localhost:9000"

  if [[ "$RUN_E2E" == true ]]; then
    log "Pokrecem Playwright E2E testove"
    compose_run "PricalicaE2E" up --build --abort-on-container-exit playwright
  fi
}

stop_stack() {
  log "Gasim PricalicaE2E"
  compose_run "PricalicaE2E" down -v || true

  log "Gasim PricalicaWebApp"
  compose_run "PricalicaWebApp/pricalicaWebApp" down -v || true

  log "Gasim PricalicaAPI"
  compose_run "PricalicaAPI" down -v || true

  log "Gasim PricalicaDB"
  compose_run "PricalicaDB" down -v || true

  log "Svi Docker servisi su ugaseni"
}

print_status() {
  log "Status PricalicaDB"
  compose_run "PricalicaDB" ps || true

  log "Status PricalicaAPI"
  compose_run "PricalicaAPI" ps || true

  log "Status PricalicaWebApp"
  compose_run "PricalicaWebApp/pricalicaWebApp" ps || true

  log "Status PricalicaE2E"
  compose_run "PricalicaE2E" ps || true
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    up|down|restart|status)
      ACTION="$1"
      ;;
    --with-e2e)
      RUN_E2E=true
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Nepoznat argument: $1"
      print_usage
      exit 1
      ;;
  esac
  shift
done

require_command docker

if ! docker info >/dev/null 2>&1; then
  echo "Docker engine nije dostupan. Pokreni Docker pa probaj ponovno."
  exit 1
fi

case "$ACTION" in
  up)
    start_stack
    ;;
  down)
    stop_stack
    ;;
  restart)
    stop_stack
    start_stack
    ;;
  status)
    print_status
    ;;
esac
