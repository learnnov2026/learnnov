#!/usr/bin/env bash
# =============================================================================
# install_learnnov_certificates.sh
# تثبيت تطبيق الشهادات العربية مع QR code في حاوية Tutor
# =============================================================================
set -e

APP_SRC="/mnt/b/LEARNNOV PLATFORM/openedx-platform-master/lms/djangoapps/learnnov_certificates"

echo "▶ التحقق من تشغيل الحاوية..."
CONTAINER=$(docker ps --filter "name=lms" --format "{{.Names}}" 2>/dev/null | head -n 1)
if [[ -z "$CONTAINER" ]]; then
  CONTAINER="tutor_local-lms-1" # Fallback
fi

docker inspect "$CONTAINER" --format='{{.State.Status}}' 2>/dev/null | grep -q running || {
  echo "❌ الحاوية غير شغّالة. شغّل: tutor local start --detach"
  exit 1
}

echo "▶ تثبيت مكتبة QR code + Pillow..."
docker exec "$CONTAINER" pip install "qrcode[pil]" Pillow --quiet

echo "▶ نسخ ملفات التطبيق..."
docker cp "$APP_SRC" "$CONTAINER":/openedx/edx-platform/lms/djangoapps/learnnov_certificates

echo "▶ تشغيل الـ migrations..."
docker exec "$CONTAINER" python manage.py lms migrate learnnov_certificates --settings=tutor.production

echo "▶ نسخ القوالب إلى staticfiles..."
docker exec "$CONTAINER" bash -c "
  mkdir -p /openedx/staticfiles/templates/learnnov_certificates
  cp -r /openedx/edx-platform/lms/djangoapps/learnnov_certificates/templates/learnnov_certificates/* \
        /openedx/staticfiles/templates/learnnov_certificates/
"

echo ""
echo "✅ تم تثبيت نظام الشهادات!"
echo ""
echo "روابط الشهادات:"
echo "  عرض الشهادة العربية:"
echo "    http://learnnov.local:8888/certificates/ar/<VERIFY_UUID>/"
echo ""
echo "  التحقق من شهادة (رابط QR):"
echo "    http://learnnov.local:8888/certificates/verify/<VERIFY_UUID>/"
echo ""
echo "للحصول على verify_uuid لشهادة:"
echo "  docker exec $CONTAINER python manage.py lms shell --settings=tutor.production -c \\"
echo "    \"from lms.djangoapps.certificates.models import GeneratedCertificate; \\"
echo "     print(GeneratedCertificate.objects.first().verify_uuid)\""
echo ""
echo "⚠️  تأكد من إضافة هذا الإعداد في lms.env.yml:"
echo "  LEARNNOV_SITE_URL: http://learnnov.local:8888"
