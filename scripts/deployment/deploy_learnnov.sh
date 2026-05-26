#!/usr/bin/env bash
# =============================================================================
# deploy_learnnov.sh — النشر الكامل لمنصة LearnNov على خادم الإنتاج
#
# شغّل بمستخدم learnnov (ليس root):
#   su - learnnov
#   bash deploy_learnnov.sh
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()    { echo -e "${GREEN}✓${NC} $*"; }
info()  { echo -e "${YELLOW}▶${NC} $*"; }
step()  { echo -e "\n${CYAN}══ $* ══${NC}"; }
ask()   { read -rp "$(echo -e "${YELLOW}?${NC} $1: ")" "$2"; }

# ════════════════════════════════════════════════════════════════════════════
step "1 — الإعدادات"
# ════════════════════════════════════════════════════════════════════════════

ask "اسم الدومين الرئيسي (مثال: learnnov.com)"   DOMAIN
ask "بريد إلكتروني للـ SSL (Let's Encrypt)"       SSL_EMAIL
ask "Stripe Secret Key (sk_live_...)"             STRIPE_SECRET
ask "Stripe Publishable Key (pk_live_...)"         STRIPE_PUB
ask "Stripe Webhook Secret (whsec_...)"            STRIPE_WEBHOOK
ask "HyperPay Access Token"                        HP_TOKEN
ask "HyperPay Entity ID — Visa/Master"             HP_ENTITY_VISA
ask "HyperPay Entity ID — mada"                    HP_ENTITY_MADA
ask "اسم مستخدم أول Admin"                         ADMIN_USER
ask "بريد Admin"                                   ADMIN_EMAIL
ask "كلمة مرور Admin"                              ADMIN_PASS

TUTOR="$HOME/.local/bin/tutor"
PLUGIN_DIR="$HOME/tutor-learnnov"

# ════════════════════════════════════════════════════════════════════════════
step "2 — تثبيت tutor-learnnov plugin"
# ════════════════════════════════════════════════════════════════════════════

if [[ ! -d "$PLUGIN_DIR" ]]; then
  info "نسخ ملفات المشروع..."
  # في الإنتاج انسخ المجلد من SCP أو git clone
  # git clone https://github.com/your-org/learnnov.git "$PLUGIN_DIR"
  echo "⚠️  الرجاء نسخ مجلد tutor-learnnov يدوياً إلى: $PLUGIN_DIR"
  echo "   ثم أعد تشغيل هذا السكريبت."
  exit 1
fi

pip install --user -e "$PLUGIN_DIR" --quiet
ok "tutor-learnnov plugin مثبَّت"

# ════════════════════════════════════════════════════════════════════════════
step "3 — ضبط Tutor"
# ════════════════════════════════════════════════════════════════════════════

$TUTOR plugins enable learnnov
$TUTOR plugins enable mfe      2>/dev/null || true
$TUTOR plugins enable indigo   2>/dev/null || true

$TUTOR config save \
  --set "LMS_HOST=${DOMAIN}" \
  --set "CMS_HOST=studio.${DOMAIN}" \
  --set "ENABLE_HTTPS=true" \
  --set "WEBPROXY_SSL_EMAIL=${SSL_EMAIL}" \
  --set "PLATFORM_NAME=LearnNov" \
  --set "LEARNNOV_SITE_URL=https://${DOMAIN}" \
  --set "LEARNNOV_STRIPE_SECRET_KEY=${STRIPE_SECRET}" \
  --set "LEARNNOV_STRIPE_PUB_KEY=${STRIPE_PUB}" \
  --set "LEARNNOV_STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK}" \
  --set "LEARNNOV_HYPERPAY_ACCESS_TOKEN=${HP_TOKEN}" \
  --set "LEARNNOV_HYPERPAY_ENTITY_ID_VISA=${HP_ENTITY_VISA}" \
  --set "LEARNNOV_HYPERPAY_ENTITY_ID_MADA=${HP_ENTITY_MADA}" \
  --set "LEARNNOV_HYPERPAY_BASE_URL=https://eu-prod.oppwa.com" \
  --set "CONTACT_EMAIL=${ADMIN_EMAIL}"

ok "إعدادات Tutor مكتملة"

# ════════════════════════════════════════════════════════════════════════════
step "4 — بناء Docker Image"
# ════════════════════════════════════════════════════════════════════════════
info "بناء الصورة (قد يستغرق 10–20 دقيقة)..."
$TUTOR images build openedx
ok "Docker image جاهز"

# ════════════════════════════════════════════════════════════════════════════
step "5 — تشغيل المنصة"
# ════════════════════════════════════════════════════════════════════════════
info "تشغيل جميع الخدمات..."
$TUTOR local launch --non-interactive

ok "المنصة تعمل"

# ════════════════════════════════════════════════════════════════════════════
step "6 — Migrations للتطبيقات المخصصة"
# ════════════════════════════════════════════════════════════════════════════
for APP in university_ads learnnov_payments learnnov_certificates academic_programs program_ads learnnov_exams; do
  info "migrate $APP..."
  $TUTOR local run lms python manage.py lms migrate "$APP" --settings=tutor.production
done
ok "كل الـ migrations مكتملة"

# ════════════════════════════════════════════════════════════════════════════
step "7 — تثبيت مكتبات Python"
# ════════════════════════════════════════════════════════════════════════════
# ملاحظة: هذه الخطوة اختيارية لأن المكتبات مدمجة في الـ Docker Image عبر الـ Plugin
# ولكننا ننفذها هنا للتأكد من توفرها في البيئات المخصصة.
$TUTOR local run lms pip install stripe "qrcode[pil]" Pillow requests --no-cache-dir
ok "المكتبات مثبَّتة"

# ════════════════════════════════════════════════════════════════════════════
step "8 — إنشاء حساب Admin"
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
print('كلمة المرور محدَّثة')
"
ok "حساب Admin: ${ADMIN_USER}"

# ════════════════════════════════════════════════════════════════════════════
step "9 — ضبط SiteConfiguration"
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

DarkLangConfig.objects.create(
    released_languages='ar, en',
    enabled=True,
    changed_by_id=1,
)
print('✓ SiteConfiguration و DarkLangConfig مكتملان')
"
ok "SiteConfiguration جاهز"

# ════════════════════════════════════════════════════════════════════════════
step "10 — Collectstatic"
# ════════════════════════════════════════════════════════════════════════════
$TUTOR local run lms python manage.py lms collectstatic --noinput \
  --settings=tutor.production 2>&1 | tail -3
ok "Static files جاهزة"

# ════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 LearnNov يعمل على الإنتاج!                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 المنصة       : ${CYAN}https://${DOMAIN}${NC}"
echo -e "  🎓 Studio       : ${CYAN}https://studio.${DOMAIN}${NC}"
echo -e "  🔧 Admin        : ${CYAN}https://${DOMAIN}/admin/${NC}"
echo -e "  👤 المستخدم     : ${ADMIN_USER}"
echo ""
echo "  روابط مهمة:"
echo "  - إعلانات الجامعات : https://${DOMAIN}/admin/university_ads/"
echo "  - طلبات الشراء     : https://${DOMAIN}/admin/learnnov_payments/"
echo "  - الشهادات         : https://${DOMAIN}/certificates/ar/<uuid>/"
echo ""
echo "  ⚠️  أضف هذا الـ Webhook URL في Stripe Dashboard:"
echo "  https://${DOMAIN}/payments/stripe/webhook/"
