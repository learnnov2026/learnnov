#!/usr/bin/env bash
# =============================================================================
# install_university_ads.sh
# نسخ تطبيق university_ads إلى حاوية Tutor وتفعيله
# شغّل هذا السكريبت من Ubuntu WSL داخل مجلد المشروع
# =============================================================================
set -e

APP_SRC="/mnt/b/LEARNNOV PLATFORM/openedx-platform-master/lms/djangoapps/university_ads"

echo "▶ التحقق من تشغيل الحاوية..."
CONTAINER=$(docker ps --filter "name=lms" --format "{{.Names}}" 2>/dev/null | head -n 1)
if [[ -z "$CONTAINER" ]]; then
  CONTAINER="tutor_local-lms-1" # Fallback
fi

docker inspect "$CONTAINER" --format='{{.State.Status}}' 2>/dev/null | grep -q running || {
  echo "❌ الحاوية غير شغّالة. شغّل: tutor local start --detach"
  exit 1
}

echo "▶ نسخ ملفات التطبيق إلى الحاوية..."
docker cp "$APP_SRC" "$CONTAINER":/openedx/edx-platform/lms/djangoapps/university_ads

echo "▶ تشغيل الـ migrations..."
docker exec "$CONTAINER" python manage.py lms migrate university_ads --settings=tutor.production

echo "▶ نسخ الـ static files..."
docker exec "$CONTAINER" python manage.py lms collectstatic --noinput \
  --settings=tutor.production 2>&1 | tail -5

# نسخ القوالب إلى staticfiles
echo "▶ نسخ القوالب إلى /openedx/staticfiles/templates/..."
docker exec "$CONTAINER" bash -c "
  mkdir -p /openedx/staticfiles/templates/university_ads
  cp -r /openedx/edx-platform/lms/djangoapps/university_ads/templates/university_ads/* \
        /openedx/staticfiles/templates/university_ads/
"

# تحديث dashboard.html و main.html في staticfiles
echo "▶ تحديث dashboard.html في staticfiles..."
docker cp "/mnt/b/LEARNNOV PLATFORM/openedx-platform-master/lms/templates/dashboard.html" \
  "$CONTAINER":/openedx/staticfiles/templates/dashboard.html

echo "▶ تحديث main.html في staticfiles..."
docker cp "/mnt/b/LEARNNOV PLATFORM/openedx-platform-master/lms/templates/main.html" \
  "$CONTAINER":/openedx/staticfiles/templates/main.html

echo ""
echo "✅ تم التثبيت بنجاح!"
echo ""
echo "الخطوة التالية — أضف جامعة وإعلاناً من لوحة الإدارة:"
echo "  http://learnnov.local:8888/admin/university_ads/"
echo ""
echo "مواضع الإعلانات المتاحة:"
echo "  dashboard_top       — أعلى لوحة التحكم"
echo "  dashboard_sidebar   — الشريط الجانبي للوحة التحكم"
echo "  search_top          — أعلى صفحة البحث"
echo "  search_sidebar      — الشريط الجانبي للبحث"
echo "  catalog             — كتالوج الدورات"
