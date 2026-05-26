#!/usr/bin/env bash
# =============================================================================
# enable_bilingual.sh
# تفعيل دعم اللغتين العربية والإنجليزية في منصة LearnNov
# شغّل من Ubuntu WSL بعد تشغيل: tutor local start --detach
# =============================================================================
set -e

TUTOR_ROOT=$(tutor config printroot 2>/dev/null || echo "$HOME/.local/share/tutor")
LMS_ENV="$TUTOR_ROOT/env/apps/openedx/config/lms.env.yml"

echo "▶ التحقق من تشغيل الحاوية..."
CONTAINER=$(docker ps --filter "name=lms" --format "{{.Names}}" 2>/dev/null | head -n 1)
if [[ -z "$CONTAINER" ]]; then
  CONTAINER="tutor_local-lms-1" # Fallback
fi

docker inspect "$CONTAINER" --format='{{.State.Status}}' 2>/dev/null | grep -q running || {
  echo "❌ الحاوية غير شغّالة. شغّل: tutor local start --detach"
  exit 1
}

# ── 1. تفعيل language selector في lms.env.yml ──────────────────────────────
echo "▶ تفعيل language selector في lms.env.yml..."

# تحقق إذا موجود مسبقاً
if grep -q "SHOW_HEADER_LANGUAGE_SELECTOR" "$LMS_ENV"; then
  sed -i 's/SHOW_HEADER_LANGUAGE_SELECTOR:.*/SHOW_HEADER_LANGUAGE_SELECTOR: true/' "$LMS_ENV"
else
  # أضفه ضمن FEATURES (إذا موجود) أو في نهاية الملف
  if grep -q "^FEATURES:" "$LMS_ENV"; then
    sed -i '/^FEATURES:/a\  SHOW_HEADER_LANGUAGE_SELECTOR: true\n  SHOW_FOOTER_LANGUAGE_SELECTOR: true' "$LMS_ENV"
  else
    echo "" >> "$LMS_ENV"
    echo "FEATURES:" >> "$LMS_ENV"
    echo "  SHOW_HEADER_LANGUAGE_SELECTOR: true" >> "$LMS_ENV"
    echo "  SHOW_FOOTER_LANGUAGE_SELECTOR: true" >> "$LMS_ENV"
  fi
fi

# ── 2. تجميع ملفات الترجمة .mo ─────────────────────────────────────────────
echo "▶ تجميع ملفات الترجمة (.po → .mo)..."

for APP in university_ads learnnov_payments learnnov_certificates; do
  APP_PATH="/openedx/edx-platform/lms/djangoapps/$APP"
  docker exec "$CONTAINER" bash -c "
    if [ -f '$APP_PATH/locale/ar/LC_MESSAGES/django.po' ]; then
      python -m msgfmt '$APP_PATH/locale/ar/LC_MESSAGES/django.po' \
             -o '$APP_PATH/locale/ar/LC_MESSAGES/django.mo'
      echo '  ✓ $APP/ar'
    fi
  " 2>/dev/null || echo "  ⚠ $APP — تحقق من مسار الملفات"
done

# ── 3. تفعيل اللغة العربية عبر DarkLangConfig ──────────────────────────────
echo "▶ الإصدار الرسمي للغة العربية (DarkLangConfig)..."

docker exec "$CONTAINER" python manage.py lms shell \
  --settings=tutor.production -c "
from openedx.core.djangoapps.dark_lang.models import DarkLangConfig
config = DarkLangConfig.current()
released = config.released_languages if hasattr(config, 'released_languages') else ''
langs = set(x.strip() for x in released.split(',') if x.strip())
langs.update(['ar', 'en'])
DarkLangConfig.objects.create(
    released_languages=', '.join(sorted(langs)),
    enabled=True,
    changed_by_id=1
)
print('DarkLangConfig updated:', ', '.join(sorted(langs)))
"

# ── 4. إعادة تشغيل LMS ────────────────────────────────────────────────────
echo "▶ إعادة تشغيل LMS لتطبيق الإعدادات..."
tutor local restart lms

echo ""
echo "✅ تم تفعيل دعم اللغتين!"
echo ""
echo "للتحقق: افتح http://learnnov.local:8888 وستجد قائمة اختيار اللغة في الرأس أو التذييل."
echo ""
echo "تغيير اللغة برمجياً:"
echo "  العربية : POST /i18n/setlang/  language=ar"
echo "  الإنجليزية: POST /i18n/setlang/  language=en"
