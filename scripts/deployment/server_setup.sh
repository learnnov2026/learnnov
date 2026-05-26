#!/usr/bin/env bash
# =============================================================================
# server_setup.sh — LearnNov Production Server Setup
# Ubuntu 22.04 LTS — DigitalOcean / AWS / GCP
#
# متطلبات الخادم الدنيا:
#   RAM  : 8 GB   (16 GB مُوصى)
#   CPU  : 4 vCPU (8 مُوصى)
#   Disk : 50 GB  (200 GB مُوصى لمحتوى الدورات)
#   OS   : Ubuntu 22.04 LTS
#
# الاستخدام:
#   curl -fsSL https://raw.githubusercontent.com/your-org/learnnov/main/server_setup.sh | sudo bash
#   أو: sudo bash server_setup.sh
# =============================================================================
set -euo pipefail

# ── ألوان ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "${YELLOW}▶${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*"; exit 1; }

[[ $EUID -eq 0 ]] || fail "شغّل السكريبت بصلاحيات root: sudo bash server_setup.sh"

# ── 1. تحديث النظام ──────────────────────────────────────────────────────────
info "تحديث حزم النظام..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
ok "النظام محدَّث"

# ── 2. أدوات أساسية ──────────────────────────────────────────────────────────
info "تثبيت الأدوات الأساسية..."
apt-get install -y -qq \
  curl wget git vim unzip \
  ca-certificates gnupg lsb-release \
  ufw fail2ban htop ncdu \
  python3-pip python3-venv
ok "الأدوات الأساسية مثبَّتة"

# ── 3. Docker ────────────────────────────────────────────────────────────────
info "تثبيت Docker..."
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi
ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# ── 4. مستخدم learnnov ───────────────────────────────────────────────────────
info "إنشاء مستخدم learnnov..."
if ! id learnnov &>/dev/null; then
  useradd -m -s /bin/bash -G docker,sudo learnnov
  echo "learnnov ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/learnnov
fi
ok "المستخدم learnnov جاهز"

# ── 5. Tutor ─────────────────────────────────────────────────────────────────
info "تثبيت Tutor..."
sudo -u learnnov pip install --user "tutor[full]>=17.0.0"
TUTOR_BIN="/home/learnnov/.local/bin/tutor"
[[ -f "$TUTOR_BIN" ]] || fail "فشل تثبيت Tutor"
ok "Tutor $(sudo -u learnnov $TUTOR_BIN --version)"

# ── 6. Firewall ──────────────────────────────────────────────────────────────
info "ضبط Firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable
ok "UFW مُفعَّل"

# ── 7. fail2ban ──────────────────────────────────────────────────────────────
info "تفعيل fail2ban..."
systemctl enable --now fail2ban
ok "fail2ban مُفعَّل"

# ── 8. Swap (إذا RAM أقل من 16 GB) ──────────────────────────────────────────
TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
if [[ $TOTAL_RAM -lt 16 ]] && ! swapon --show | grep -q /swapfile; then
  info "إضافة Swap (8GB)..."
  fallocate -l 8G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "Swap 8GB مُضاف"
fi

# ── 9. تحسينات Kernel لـ Docker ──────────────────────────────────────────────
cat >> /etc/sysctl.conf << 'EOF'
vm.swappiness=10
net.core.somaxconn=65535
net.ipv4.tcp_tw_reuse=1
EOF
sysctl -p &>/dev/null

# ── ملخص ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ إعداد الخادم اكتمل!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "الخطوة التالية:"
echo "  su - learnnov"
echo "  bash /path/to/deploy_learnnov.sh"
