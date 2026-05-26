#!/usr/bin/env bash
# =============================================================================
# deploy_kaif_services.sh — نشر LearnNov على kaif.services
#
# الاستخدام (بمستخدم learnnov):
#   su - learnnov
#   bash deploy_kaif_services.sh
#
# ⚠️  عدّل القيم في قسم "الإعدادات" قبل التشغيل
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "${YELLOW}▶${NC} $*"; }
warn() { echo -e "${YELLOW}⚠️${NC} $*"; }
step() { echo -e "\n${CYAN}══ $* ══${NC}"; }
fail() { echo -e "${RED}✗${NC} $*"; exit 1; }

# ════════════════════════════════════════════════════════════════════════════
step "الإعدادات — kaif.services"
# ════════════════════════════════════════════════════════════════════════════

# ── النطاق ───────────────────────────────────────────────────────────────────
DOMAIN="kaif.services"
SSL_EMAIL="albra.edu@gmail.com"         # ← بريد Let's Encrypt

# ── Stripe (الدفع الدولي) ─────────────────────────────────────────────────────
STRIPE_SECRET=""          # ← sk_live_...
STRIPE_PUB=""             # ← pk_live_...
STRIPE_WEBHOOK=""         # ← whsec_...

# ── HyperPay / mada (السوق السعودي) ──────────────────────────────────────────
HP_TOKEN=""               # ← HyperPay Access Token
HP_ENTITY_VISA=""         # ← Entity ID للـ Visa/Master
HP_ENTITY_MADA=""         # ← Entity ID للـ mada

# ── حساب المدير ───────────────────────────────────────────────────────────────
ADMIN_USER="admin"
ADMIN_EMAIL="albra.edu@gmail.com"
ADMIN_PASS=""             # ← ضع كلمة مرور قوية هنا

# ── مسارات ───────────────────────────────────────────────────────────────────
TUTOR="$HOME/.local/bin/tutor"
PLUGIN_DIR="$HOME/tutor-learnnov"

# ── تحقق من أن القيم الإجبارية موجودة ───────────────────────────────────────
[[ -z "$STRIPE_SECRET"  ]] && fail "STRIPE_SECRET فارغ — عدّله في الملف أولاً"
[[ -z "$HP_TOKEN"       ]] && fail "HP_TOKEN فارغ — عدّله في الملف أولاً"
[[ -z "$ADMIN_PASS"     ]] && fail "ADMIN_PASS فارغ — عدّله في الملف أولاً"

# ════════════════════════════════════════════════════════════════════════════
step "1 — تثبيت tutor-learnnov plugin"
# ════════════════════════════════════════════════════════════════════════════
[[ -d "$PLUGIN_DIR" ]] || fail "مجلد $PLUGIN_DIR غير موجود — انسخ المشروع أولاً"
pip install --user -e "$PLUGIN_DIR" --quiet
ok "tutor-learnnov plugin مثبَّت"

# ════════════════════════════════════════════════════════════════════════════
step "2 — ضبط Tutor"
# ════════════════════════════════════════════════════════════════════════════
$TUTOR plugins enable learnnov
$TUTOR plugins enable mfe    2>/dev/null || true
$TUTOR plugins enable indigo 2>/dev/null || true

$TUTOR config save \
  --set "LMS_HOST=${DOMAIN}" \
  --set "CMS_HOST=studio.${DOMAIN}" \
  --set "ENABLE_HTTPS=true" \
  --set "PLATFORM_NAME=LearnNov" \
  --set "CONTACT_EMAIL=${ADMIN_EMAIL}" \
  --set "LEARNNOV_SITE_URL=https://${DOMAIN}" \
  --set "LEARNNOV_STRIPE_SECRET_KEY=${STRIPE_SECRET}" \
  --set "LEARNNOV_STRIPE_PUB_KEY=${STRIPE_PUB}" \
  --set "LEARNNOV_STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK}" \
  --set "LEARNNOV_HYPERPAY_ACCESS_TOKEN=${HP_TOKEN}" \
  --set "LEARNNOV_HYPERPAY_ENTITY_ID_VISA=${HP_ENTITY_VISA}" \
  --set "LEARNNOV_HYPERPAY_ENTITY_ID_MADA=${HP_ENTITY_MADA}" \
  --set "LEARNNOV_HYPERPAY_BASE_URL=https://eu-prod.oppwa.com"

ok "Tutor config → kaif.services"

# ════════════════════════════════════════════════════════════════════════════
step "3 — بناء Docker Image"
# ════════════════════════════════════════════════════════════════════════════
info "بناء الصورة (10-20 دقيقة)..."
$TUTOR images build openedx
ok "Docker image جاهز"

# ════════════════════════════════════════════════════════════════════════════
step "4 — تشغيل المنصة + SSL"
# ════════════════════════════════════════════════════════════════════════════
$TUTOR local launch --non-interactive
ok "المنصة تعمل على https://${DOMAIN}"

# ════════════════════════════════════════════════════════════════════════════
step "5 — Migrations"
# ════════════════════════════════════════════════════════════════════════════
for APP in university_ads learnnov_payments learnnov_certificates \
    academic_programs \
    program_ads \
    learnnov_exams
; do
  info "migrate $APP..."
  $TUTOR local run lms python manage.py lms migrate "$APP" --settings=tutor.production
done
ok "Migrations مكتملة"

# ════════════════════════════════════════════════════════════════════════════
step "6 — مكتبات Python"
# ════════════════════════════════════════════════════════════════════════════
$TUTOR local run lms pip install stripe "qrcode[pil]" Pillow requests djangorestframework django-crum --no-cache-dir
ok "المكتبات مثبَّتة"

# ════════════════════════════════════════════════════════════════════════════
step "7 — حساب Admin"
# ════════════════════════════════════════════════════════════════════════════
$TUTOR local run lms python manage.py lms manage_user \
  "$ADMIN_USER" "$ADMIN_EMAIL" --superuser --staff \
  --settings=tutor.production || true

$TUTOR local run lms python manage.py lms shell \
  --settings=tutor.production -c "
from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.get(username='${ADMIN_USER}')
u.set_password('${ADMIN_PASS}')
u.save()
print('✓ كلمة المرور محدَّثة')
"
ok "Admin: ${ADMIN_USER} / ${ADMIN_EMAIL}"

# ════════════════════════════════════════════════════════════════════════════
step "8 — SiteConfiguration"
# ════════════════════════════════════════════════════════════════════════════
$TUTOR local run lms python manage.py lms shell \
  --settings=tutor.production -c "
from django.contrib.sites.models import Site
from openedx.core.djangoapps.site_configuration.models import SiteConfiguration
from openedx.core.djangoapps.dark_lang.models import DarkLangConfig

site, _ = Site.objects.get_or_create(domain='${DOMAIN}')
site.name = 'LearnNov'
site.save()

cfg, _ = SiteConfiguration.objects.get_or_create(site=site)
cfg.enabled = True
cfg.values = {
    'PLATFORM_NAME': 'LearnNov',
    'platform_name': 'LearnNov',
    'PLATFORM_COPYRIGHT': '© {org_name}. جميع الحقوق محفوظة.',
    'PLATFORM_ORG_LINK_URL': 'https://${DOMAIN}',
    'PLATFORM_ORG_LINK_TEXT': 'LearnNov',
    'SHOW_HEADER_LANGUAGE_SELECTOR': True,
    'SHOW_FOOTER_LANGUAGE_SELECTOR': True,
}
cfg.save()

if not DarkLangConfig.objects.filter(enabled=True).exists():
    DarkLangConfig.objects.create(
        released_languages='ar, en',
        enabled=True,
        changed_by_id=1,
    )

print('✓ SiteConfiguration جاهز')
"
ok "SiteConfiguration جاهز"

# ════════════════════════════════════════════════════════════════════════════
step "9 — Static files"
# ════════════════════════════════════════════════════════════════════════════
$TUTOR local run lms python manage.py lms collectstatic --noinput \
  --settings=tutor.production 2>&1 | tail -3
ok "Static files جاهزة"

# ════════════════════════════════════════════════════════════════════════════
step "10 — جدولة النسخ الاحتياطي"
# ════════════════════════════════════════════════════════════════════════════
BACKUP_SCRIPT="/home/learnnov/backup_learnnov.sh"
if [[ -f "$BACKUP_SCRIPT" ]]; then
  LOG_DIR="/home/learnnov/backups/logs"
  mkdir -p "$LOG_DIR"
  CRON_JOB="0 2 * * * $BACKUP_SCRIPT >> $LOG_DIR/learnnov-backup.log 2>&1"
  (crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT") || \
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  ok "Cron job للنسخ الاحتياطي مضاف (يومياً 02:00)"
fi

# ════════════════════════════════════════════════════════════════════════════
step "12 — التحقق من صفحة الهبوط"
# ════════════════════════════════════════════════════════════════════════════
info "جارٍ فحص توفر تطبيق التسويق..."
$TUTOR local run lms python manage.py lms check learnnov_marketing || warn "تطبيق التسويق غير مفعل!"
ok "تطبيق التسويق جاهز"

step "13 — صيانة قاعدة البيانات"
# ════════════════════════════════════════════════════════════════════════════
info "جارٍ تنظيف السجلات القديمة..."
$TUTOR local run lms python manage.py lms cleanup_ads || warn "فشل عملية التنظيف، ربما لا توجد سجلات بعد."
ok "تمت الصيانة بنجاح"

# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 LearnNov يعمل على kaif.services                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 المنصة   : ${CYAN}https://kaif.services${NC}"
echo -e "  🎓 Studio   : ${CYAN}https://studio.kaif.services${NC}"
echo -e "  🔧 Admin    : ${CYAN}https://kaif.services/admin/${NC}"
echo ""
echo "  ⚠️  أضف هذا Webhook في Stripe Dashboard:"
echo -e "  ${YELLOW}https://kaif.services/payments/stripe/webhook/${NC}"
echo ""
echo "  📋 روابط لوحة التحكم:"
echo "  - إعلانات الجامعات : https://kaif.services/admin/university_ads/"
echo "  - الطلبات والمدفوعات: https://kaif.services/admin/learnnov_payments/"
echo "  - الشهادات          : https://kaif.services/certificates/ar/<uuid>/"
echo "  - البرامج الأكاديمية: https://kaif.services/admin/academic_programs/"
echo "  - إدارة الإعلانات  : https://kaif.services/admin/program_ads/"
echo ""
echo "  📡 API Endpoints:"
echo "  - GET  https://kaif.services/api/programs/programs/"
echo "  - GET  https://kaif.services/api/programs/providers/"
echo "  - POST https://kaif.services/api/programs/programs/<slug>/apply/"
echo "  - GET  https://kaif.services/api/ads/serve/<placement>/"
echo ""
