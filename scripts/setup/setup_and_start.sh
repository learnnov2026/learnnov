#!/bin/sh
# =============================================================================
# setup_and_start.sh - LearnNov Setup & Launch (runs inside WSL Ubuntu)
# =============================================================================

export PATH="$HOME/.local/bin:$PATH"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { printf "${GREEN}  [OK]${NC} %s\n" "$*"; }
fail() { printf "${RED}  [FAIL]${NC} %s\n" "$*"; }
step() { printf "${YELLOW}[%s]${NC} %s\n" "$1" "$2"; }
info() { printf "  %s\n" "$*"; }

echo ""
printf "${CYAN}========================================${NC}\n"
printf "${CYAN}  LearnNov Platform - Auto Launcher${NC}\n"
printf "${CYAN}========================================${NC}\n"
echo ""

# --- Step 1: Docker ---
step "1/5" "Checking Docker..."
if docker info > /dev/null 2>&1; then
    ok "Docker is available"
else
    fail "Docker not available"
    echo "  Make sure Docker Desktop is running and WSL integration is enabled for Ubuntu-22.04"
    echo "  Docker Desktop -> Settings -> Resources -> WSL Integration -> Enable Ubuntu-22.04"
    exit 1
fi

# --- Step 2: Python/pip ---
step "2/5" "Checking Python..."
if command -v pip3 > /dev/null 2>&1; then
    ok "Python3/pip3 found"
else
    info "Installing python3-pip..."
    sudo apt-get update -qq && sudo apt-get install -y -qq python3-pip
    if command -v pip3 > /dev/null 2>&1; then
        ok "pip3 installed"
    else
        fail "Could not install pip3"
        exit 1
    fi
fi

# --- Step 3: Tutor ---
step "3/5" "Checking Tutor..."
if command -v tutor > /dev/null 2>&1; then
    ok "Tutor found: $(tutor --version 2>/dev/null)"
else
    info "Installing Tutor (this may take a few minutes)..."
    pip3 install --user 'tutor[full]>=17.0.0'
    export PATH="$HOME/.local/bin:$PATH"
    if command -v tutor > /dev/null 2>&1; then
        ok "Tutor installed: $(tutor --version 2>/dev/null)"
    else
        fail "Tutor installation failed"
        exit 1
    fi
fi

# --- Step 4: LearnNov Plugin ---
step "4/5" "Installing LearnNov plugin..."
PLUGIN_DIR="/mnt/b/LEARNNOV PLATFORM/tutor-learnnov"
if [ -d "$PLUGIN_DIR" ]; then
    pip3 install --user -e "$PLUGIN_DIR" --quiet 2>&1 | tail -2
    tutor plugins enable learnnov 2>/dev/null || true
    ok "LearnNov plugin enabled"
else
    info "Plugin directory not found at: $PLUGIN_DIR"
    info "Continuing without custom plugin..."
fi

# --- Step 5: Launch ---
step "5/5" "Launching platform..."

# Check if already running
RUNNING=$(docker ps --filter "name=tutor" --format "{{.Names}}" 2>/dev/null | head -1)
if [ -n "$RUNNING" ]; then
    ok "Platform is already running!"
    echo ""
    tutor local status 2>/dev/null
else
    # Check if initialized
    TUTOR_ROOT="$(tutor config printroot 2>/dev/null)"
    if [ -f "$TUTOR_ROOT/config.yml" ]; then
        info "Starting all services..."
        tutor local start -d
        echo ""
        ok "Platform started!"
        tutor local status 2>/dev/null
    else
        info "Platform not initialized yet. Running first-time setup..."
        info "This will take 10-20 minutes on first run."
        tutor local launch
    fi
fi

echo ""
printf "${GREEN}========================================${NC}\n"
printf "${GREEN}  LearnNov is READY!${NC}\n"
printf "${GREEN}========================================${NC}\n"
echo ""
printf "  LMS     : ${CYAN}http://local.edly.io${NC}\n"
printf "  Studio  : ${CYAN}http://studio.local.edly.io${NC}\n"
printf "  Admin   : ${CYAN}http://local.edly.io/admin/${NC}\n"
echo ""
