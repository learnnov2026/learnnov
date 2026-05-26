#!/usr/bin/env bash
# =============================================================================
# setup_learnnov_branding.sh
# ضبط اسم المنصة "LearnNov" في جميع أنحاء Open edX
# شغّل من Ubuntu WSL بعد تشغيل: tutor local start --detach
# =============================================================================
set -e

TUTOR_ROOT=$(tutor config printroot 2>/dev/null || echo "$HOME/.local/share/tutor")
LMS_ENV="$TUTOR_ROOT/env/apps/openedx/config/lms.env.yml"
CMS_ENV="$TUTOR_ROOT/env/apps/openedx/config/cms.env.yml"

echo "▶ التحقق من تشغيل الحاوية..."
CONTAINER=$(docker ps --filter "name=lms" --format "{{.Names}}" 2>/dev/null | head -n 1)
if [[ -z "$CONTAINER" ]]; then
  CONTAINER="tutor_local-lms-1" # Fallback
fi

docker inspect "$CONTAINER" --format='{{.State.Status}}' 2>/dev/null | grep -q running || {
  echo "❌ الحاوية غير شغّالة. شغّل: tutor local start --detach"
  exit 1
}

# ── دالة مساعدة لإضافة أو تحديث إعداد ──────────────────────────────────────
set_setting() {
  local FILE="$1" KEY="$2" VALUE="$3"
  if grep -q "^${KEY}:" "$FILE" 2>/dev/null; then
    sed -i "s|^${KEY}:.*|${KEY}: ${VALUE}|" "$FILE"
  else
    echo "${KEY}: ${VALUE}" >> "$FILE"
  fi
}

echo "▶ ضبط إعدادات LearnNov في lms.env.yml..."

set_setting "$LMS_ENV" "PLATFORM_NAME"         '"LearnNov"'
set_setting "$LMS_ENV" "PLATFORM_DESCRIPTION"  '"منصة التعلُّم الإلكتروني العربي"'
set_setting "$LMS_ENV" "SITE_NAME"             '"learnnov.com"'
set_setting "$LMS_ENV" "PLATFORM_TWITTER_ACCOUNT"  '"@LearnNov"'
set_setting "$LMS_ENV" "PLATFORM_FACEBOOK_ACCOUNT" '"https://www.facebook.com/LearnNov"'

# حقوق الملكية المخصصة
set_setting "$LMS_ENV" "PLATFORM_COPYRIGHT"    '"© {org_name}. جميع الحقوق محفوظة."'

# رابط المنصة في الـ footer (بدلاً من edX.org)
set_setting "$LMS_ENV" "PLATFORM_ORG_LINK_URL"  '"https://learnnov.com"'
set_setting "$LMS_ENV" "PLATFORM_ORG_LINK_TEXT" '"تعلَّم مع LearnNov"'

# إخفاء شعار "Powered by Open edX" في الـ footer
set_setting "$LMS_ENV" "HIDE_OPENEDX_FOOTER_LINK" "true"

echo "▶ ضبط إعدادات LearnNov في cms.env.yml..."
set_setting "$CMS_ENV" "PLATFORM_NAME" '"LearnNov"'
set_setting "$CMS_ENV" "SITE_NAME"     '"studio.learnnov.com"'

# ── ضبط SiteConfiguration من قاعدة البيانات ────────────────────────────────
echo "▶ تحديث SiteConfiguration في قاعدة البيانات..."

docker exec "$CONTAINER" python manage.py lms shell \
  --settings=tutor.production -c "
from django.contrib.sites.models import Site
from openedx.core.djangoapps.site_configuration.models import SiteConfiguration

site, _ = Site.objects.get_or_create(domain='learnnov.local:8888')
site.name = 'LearnNov'
site.save()

cfg, created = SiteConfiguration.objects.get_or_create(site=site)
cfg.enabled = True
values = cfg.values or {}
values.update({
    'PLATFORM_NAME': 'LearnNov',
    'PLATFORM_DESCRIPTION': 'منصة التعلُّم الإلكتروني العربي',
    'platform_name': 'LearnNov',
    'SITE_NAME': 'learnnov.local:8888',
    'PLATFORM_COPYRIGHT': '© {org_name}. جميع الحقوق محفوظة.',
    'PLATFORM_ORG_LINK_URL': 'https://learnnov.com',
    'PLATFORM_ORG_LINK_TEXT': 'تعلَّم مع LearnNov',
    'SHOW_HEADER_LANGUAGE_SELECTOR': True,
    'SHOW_FOOTER_LANGUAGE_SELECTOR': True,
})
cfg.values = values
cfg.save()
print('✓ SiteConfiguration محدَّث لـ:', site.domain)
"

# ── نسخ ملف branding/api.py المعدَّل إلى الحاوية ───────────────────────────
echo "▶ نسخ branding/api.py المعدَّل..."
docker cp \
  "/mnt/b/LEARNNOV PLATFORM/openedx-platform-master/lms/djangoapps/branding/api.py" \
  "$CONTAINER":/openedx/edx-platform/lms/djangoapps/branding/api.py

# ── إعادة تشغيل LMS ─────────────────────────────────────────────────────────
echo "▶ إعادة تشغيل LMS..."
tutor local restart lms

echo ""
echo "✅ تم ضبط العلامة التجارية LearnNov بالكامل!"
echo ""
echo "ما تغيَّر:"
echo "  ✓ اسم المنصة في الرأس والتذييل وجميع الصفحات: LearnNov"
echo "  ✓ نص حقوق الملكية: © LearnNov. جميع الحقوق محفوظة."
echo "  ✓ رابط التذييل: https://learnnov.com"
echo "  ✓ حسابات التواصل: @LearnNov"
echo "  ✓ اسم الموقع في قاعدة البيانات: learnnov.local:8888"
