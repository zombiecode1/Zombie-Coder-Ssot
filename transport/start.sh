#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ZombieCoder Transport — Service Runner + Tunnel Connector
# ═══════════════════════════════════════════════════════════════
# 
# Usage:
#   ./start.sh          — Start all services + tunnel
#   ./start.sh status   — Check service status
#   ./start.sh stop     — Stop all services
#   ./start.sh tunnel   — Connect Cloudflare tunnel only
#
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/pids"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# ── Service Definitions ────────────────────────────────────────

declare -A SERVICES=(
  ["proxi-api"]="cd $PROJECT_DIR && node dist/index.js"
  ["ws-server"]="cd $PROJECT_DIR && node dist/transport/ws-server.js"
  ["admin-panel"]="cd $PROJECT_DIR/test/documentation/admin && npx next dev -p 3001"
)

declare -A PORTS=(
  ["proxi-api"]=9999
  ["ws-server"]=3333
  ["admin-panel"]=3001
)

# ── Functions ──────────────────────────────────────────────────

log() {
  echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date +%H:%M:%S)] WARN:${NC} $1"
}

error() {
  echo -e "${RED}[$(date +%H:%M:%S)] ERROR:${NC} $1"
}

check_port() {
  lsof -ti:$1 2>/dev/null | head -1
}

kill_port() {
  local pid=$(check_port $1)
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null || true
    sleep 1
    kill -9 $pid 2>/dev/null || true
  fi
}

start_service() {
  local name=$1
  local cmd=$2
  local port=$3
  local pid_file="$PID_DIR/$name.pid"
  local log_file="$LOG_DIR/$name.log"

  # Check if already running
  if [ -f "$pid_file" ] && kill -0 $(cat "$pid_file") 2>/dev/null; then
    warn "$name already running (PID: $(cat $pid_file))"
    return
  fi

  # Check port
  local existing=$(check_port $port)
  if [ -n "$existing" ]; then
    warn "$name: Port $port in use (PID: $existing), killing..."
    kill_port $port
    sleep 1
  fi

  log "Starting $name on port $port..."
  nohup bash -c "$cmd" > "$log_file" 2>&1 &
  echo $! > "$pid_file"
  
  # Wait for startup
  sleep 3
  
  if kill -0 $(cat "$pid_file") 2>/dev/null; then
    log "$name ${GREEN}started${NC} (PID: $(cat $pid_file))"
  else
    error "$name failed to start. Check $log_file"
  fi
}

stop_service() {
  local name=$1
  local pid_file="$PID_DIR/$name.pid"
  
  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      log "Stopping $name (PID: $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pid_file"
  fi
  
  local port=${PORTS[$name]}
  if [ -n "$port" ]; then
    kill_port $port
  fi
}

check_service() {
  local name=$1
  local port=$2
  local pid_file="$PID_DIR/$name.pid"
  
  if [ -f "$pid_file" ] && kill -0 $(cat "$pid_file") 2>/dev/null; then
    local pid=$(cat "$pid_file")
    local latency=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout 2 "http://localhost:$port" 2>/dev/null || echo "-1")
    echo -e "  ${GREEN}●${NC} $name (port $port, PID $pid, ${latency}s)"
  else
    echo -e "  ${RED}✗${NC} $name (port $port, stopped)"
  fi
}

connect_tunnel() {
  log "Connecting Cloudflare tunnel..."
  log "Tunnel: zombiecoder-tunnel (6ec068de-d21e-4e82-a446-e02ed28f8569)"
  
  # Check if cloudflared is installed
  if ! command -v cloudflared &>/dev/null; then
    warn "cloudflared not found. Install with:"
    echo "  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared"
    echo "  chmod +x /usr/local/bin/cloudflared"
    return 1
  fi
  
  # Start tunnel
  nohup cloudflared tunnel run zombiecoder-tunnel > "$LOG_DIR/tunnel.log" 2>&1 &
  echo $! > "$PID_DIR/tunnel.pid"
  
  sleep 3
  if kill -0 $(cat "$PID_DIR/tunnel.pid") 2>/dev/null; then
    log "Tunnel ${GREEN}connected${NC}"
  else
    error "Tunnel failed. Check $LOG_DIR/tunnel.log"
  fi
}

# ── Commands ───────────────────────────────────────────────────

case "${1:-start}" in
  start)
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  ZombieCoder Transport — Starting Services${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    
    # Build first
    log "Building project..."
    cd "$PROJECT_DIR" && npm run build 2>&1 | tail -1
    
    # Start services
    for name in "${!SERVICES[@]}"; do
      start_service "$name" "${SERVICES[$name]}" "${PORTS[$name]}"
    done
    
    # Connect tunnel
    connect_tunnel
    
    echo ""
    log "All services started!"
    echo ""
    echo -e "  ${BLUE}Service Status:${NC}"
    for name in "${!SERVICES[@]}"; do
      check_service "$name" "${PORTS[$name]}"
    done
    echo ""
    echo -e "  ${BLUE}URLs:${NC}"
    echo -e "  Dashboard: ${GREEN}http://localhost:3333${NC}"
    echo -e "  API:       ${GREEN}http://localhost:9999${NC}"
    echo -e "  Admin:     ${GREEN}http://localhost:3001${NC}"
    echo -e "  Tunnel:    ${GREEN}https://g.zombiecoder.my.id${NC}"
    echo ""
    ;;

  status)
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  ZombieCoder Transport — Service Status${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    
    for name in "${!SERVICES[@]}"; do
      check_service "$name" "${PORTS[$name]}"
    done
    
    # Check tunnel
    if [ -f "$PID_DIR/tunnel.pid" ] && kill -0 $(cat "$PID_DIR/tunnel.pid") 2>/dev/null; then
      echo -e "  ${GREEN}●${NC} cloudflared tunnel (PID: $(cat $PID_DIR/tunnel.pid))"
    else
      echo -e "  ${RED}✗${NC} cloudflared tunnel (stopped)"
    fi
    echo ""
    ;;

  stop)
    log "Stopping all services..."
    
    for name in "${!SERVICES[@]}"; do
      stop_service "$name"
    done
    
    # Stop tunnel
    if [ -f "$PID_DIR/tunnel.pid" ]; then
      kill $(cat "$PID_DIR/tunnel.pid") 2>/dev/null || true
      rm -f "$PID_DIR/tunnel.pid"
    fi
    
    log "All services stopped"
    ;;

  tunnel)
    connect_tunnel
    ;;

  restart)
    $0 stop
    sleep 2
    $0 start
    ;;

  logs)
    local service="${2:-proxi-api}"
    tail -f "$LOG_DIR/$service.log"
    ;;

  *)
    echo "Usage: $0 {start|stop|status|tunnel|restart|logs [service]}"
    exit 1
    ;;
esac
