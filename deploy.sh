#!/usr/bin/env bash
set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Colour

log()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC}    $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
fail() { echo -e "${RED}[error]${NC} $*"; exit 1; }

# ─── Must run as root / sudo ───────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    fail "Run this script with sudo: sudo bash deploy.sh"
fi

# ─── Detect OS ────────────────────────────────────────────────────────────────
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$ID
else
    fail "Cannot detect OS. /etc/os-release not found."
fi

log "Detected OS: $OS"

# ─── Install Docker if not present ────────────────────────────────────────────
install_docker() {
    log "Installing Docker..."

    case "$OS" in
        ubuntu|debian)
            apt-get update -y
            apt-get install -y ca-certificates curl gnupg lsb-release

            install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg \
                | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            chmod a+r /etc/apt/keyrings/docker.gpg

            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
                https://download.docker.com/linux/$OS \
                $(lsb_release -cs) stable" \
                > /etc/apt/sources.list.d/docker.list

            apt-get update -y
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;

        centos|rhel|fedora|amzn)
            yum install -y yum-utils
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;

        *)
            fail "Unsupported OS: $OS. Install Docker manually and re-run."
            ;;
    esac

    systemctl enable docker
    systemctl start docker
    ok "Docker installed and started."
}

if command -v docker &>/dev/null; then
    ok "Docker already installed: $(docker --version)"
else
    install_docker
fi

# ─── Verify Docker Compose plugin ─────────────────────────────────────────────
if ! docker compose version &>/dev/null; then
    fail "Docker Compose plugin not found. Ensure docker-compose-plugin is installed."
fi
ok "Docker Compose: $(docker compose version --short)"

# ─── Locate compose file ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/compose.prod.yaml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
    fail "compose.prod.yaml not found at: $COMPOSE_FILE"
fi

log "Using compose file: $COMPOSE_FILE"

# ─── Ensure data directory exists (volume mount) ──────────────────────────────
DATA_DIR="${SCRIPT_DIR}/data"
if [[ ! -d "$DATA_DIR" ]]; then
    log "Creating data directory at $DATA_DIR"
    mkdir -p "$DATA_DIR"
fi

# ─── Build & bring up containers ──────────────────────────────────────────────
log "Building images..."
docker compose -f "$COMPOSE_FILE" build --no-cache

log "Starting containers..."
docker compose -f "$COMPOSE_FILE" up -d

# ─── Health check ─────────────────────────────────────────────────────────────
log "Waiting for containers to stabilise..."
sleep 5

RUNNING=$(docker compose -f "$COMPOSE_FILE" ps --status running --quiet | wc -l)
EXPECTED=2

if [[ "$RUNNING" -ge "$EXPECTED" ]]; then
    ok "All containers are running."
    docker compose -f "$COMPOSE_FILE" ps
else
    warn "Some containers may not be running. Check logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=50
    exit 1
fi

echo ""
ok "Deployment complete."
echo -e "  ${CYAN}Backend${NC}  → http://localhost:3000"
echo -e "  ${CYAN}Frontend${NC} → http://localhost:8080"