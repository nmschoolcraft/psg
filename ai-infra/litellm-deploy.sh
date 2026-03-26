#!/usr/bin/env bash
# LiteLLM Proxy — Deploy/Update Script
# Run on the apps server (128.140.81.55) as root.
#
# Usage:
#   bash ai-infra/litellm-deploy.sh          — install or update LiteLLM
#   bash ai-infra/litellm-deploy.sh status   — show running status
#   bash ai-infra/litellm-deploy.sh stop     — stop the proxy
#
# Prerequisites (set in /etc/environment or ~/.bashrc before running):
#   ANTHROPIC_API_KEY=sk-ant-...
#   OPENAI_API_KEY=sk-...
#   LITELLM_MASTER_KEY=sk-litellm-...  (generate: openssl rand -hex 24)
#   LITELLM_DATABASE_URL=postgresql://... (optional, for spend tracking)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$REPO_ROOT/ai-infra/litellm_config.yaml"
PORT=4000
SERVICE="litellm-proxy"

case "${1:-install}" in
  status)
    echo "=== LiteLLM Proxy Status ==="
    if pm2 list | grep -q "$SERVICE"; then
      pm2 show "$SERVICE"
    elif systemctl is-active --quiet "$SERVICE" 2>/dev/null; then
      systemctl status "$SERVICE"
    else
      echo "Not running via pm2 or systemd."
    fi
    echo ""
    echo "=== Health check ==="
    curl -sf "http://127.0.0.1:$PORT/health" && echo "" || echo "Health check failed — proxy may not be running."
    exit 0
    ;;
  stop)
    pm2 stop "$SERVICE" 2>/dev/null || true
    pm2 delete "$SERVICE" 2>/dev/null || true
    echo "Stopped."
    exit 0
    ;;
esac

echo "=== Installing / updating LiteLLM proxy ==="

# Install litellm if not present
if ! command -v litellm &>/dev/null; then
  echo "Installing litellm via pip..."
  pip3 install 'litellm[proxy]' --quiet
fi

# Stop existing pm2 process if running
pm2 delete "$SERVICE" 2>/dev/null || true

# Validate required env vars
for var in ANTHROPIC_API_KEY OPENAI_API_KEY LITELLM_MASTER_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: $var is not set. Export it before running this script." >&2
    exit 1
  fi
done

echo "Starting LiteLLM proxy on port $PORT..."

pm2 start \
  --name "$SERVICE" \
  --interpreter bash \
  -- -c "litellm --config '$CONFIG' --port $PORT --host 0.0.0.0"

pm2 save

echo ""
echo "=== LiteLLM proxy started ==="
echo "  Endpoint : http://127.0.0.1:$PORT"
echo "  Config   : $CONFIG"
echo "  pm2 name : $SERVICE"
echo ""
echo "Health check (wait ~5s for startup):"
sleep 5
curl -sf "http://127.0.0.1:$PORT/health" && echo "OK" || echo "Not yet ready — check: pm2 logs $SERVICE"

echo ""
echo "=== Next step: generate virtual keys per app ==="
echo "  curl -X POST http://127.0.0.1:$PORT/key/generate \\"
echo "       -H 'Authorization: Bearer \$LITELLM_MASTER_KEY' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"key_alias\": \"embedding-pipeline\", \"models\": [\"embeddings\"], \"max_budget\": 10}'"
