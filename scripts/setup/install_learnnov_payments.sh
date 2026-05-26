#!/usr/bin/env bash
# =============================================================================
# install_learnnov_payments.sh
# تثبيت تطبيق الدفع (Stripe + HyperPay) في حاوية Tutor
# شغّل من Ubuntu WSL بعد تشغيل: tutor local start --detach
# =============================================================================
set -e

APP_SRC="/mnt/b/LEARNNOV PLATFORM/openedx-platform-master/lms/djangoapps/learnnov_payments"

echo "▶ التحقق من تشغيل الحاوية..."
CONTAINER=$(docker ps --filter "name=lms" --format "{{.Names}}" 2>/dev/null | head -n 1)
if [[ -z "$CONTAINER" ]]; then
  CONTAINER="tutor_local-lms-1" # Fallback
fi

docker inspect "$CONTAINER" --format='{{.State.Status}}' 2>/dev/null | grep -q running || {
  echo "❌ الحاوية غير شغّالة. شغّل: tutor local start --detach"
  exit 1
}

echo "▶ تثبيت مكتبة stripe داخل الحاوية..."
docker exec "$CONTAINER" pip install stripe requests --quiet

echo "▶ نسخ ملفات التطبيق..."
docker cp "$APP_SRC" "$CONTAINER":/openedx/edx-platform/lms/djangoapps/learnnov_payments

echo "▶ تشغيل الـ migrations..."
docker exec "$CONTAINER" python manage.py lms migrate learnnov_payments --settings=tutor.production

echo "▶ جمع الـ static files..."
docker exec "$CONTAINER" python manage.py lms collectstatic --noinput \
  --settings=tutor.production 2>&1 | tail -5

echo "▶ نسخ القوالب إلى staticfiles..."
docker exec "$CONTAINER" bash -c "
  mkdir -p /openedx/staticfiles/templates/learnnov_payments
  cp -r /openedx/edx-platform/lms/djangoapps/learnnov_payments/templates/learnnov_payments/* \
        /openedx/staticfiles/templates/learnnov_payments/
"

echo "▶ تحديث main.html في staticfiles..."
docker cp "/mnt/b/LEARNNOV PLATFORM/openedx-platform-master/lms/templates/main.html" \
  "$CONTAINER":/openedx/staticfiles/templates/main.html

echo ""
echo "✅ تم تثبيت نظام الدفع!"
echo ""
echo "══════════════════════════════════════════════════"
echo "  الخطوة التالية — أضف مفاتيح API في Tutor:"
echo "══════════════════════════════════════════════════"
echo ""
echo "افتح ملف الإعدادات:"
echo "  nano ~/.local/share/tutor/env/apps/openedx/config/lms.env.yml"
echo ""
echo "أضف هذه الأسطر:"
echo "  LEARNNOV_STRIPE_SECRET_KEY: sk_test_..."
echo "  LEARNNOV_STRIPE_PUBLISHABLE_KEY: pk_test_..."
echo "  LEARNNOV_STRIPE_WEBHOOK_SECRET: whsec_..."
echo "  LEARNNOV_HYPERPAY_ACCESS_TOKEN: OGE4..."
echo "  LEARNNOV_HYPERPAY_ENTITY_ID_VISA: 8a82..."
echo "  LEARNNOV_HYPERPAY_ENTITY_ID_MADA: 8a82..."
echo "  LEARNNOV_HYPERPAY_BASE_URL: https://eu-test.oppwa.com"
echo "  LEARNNOV_SITE_URL: http://learnnov.local:8888"
echo ""
echo "ثم أعد تشغيل الحاوية:"
echo "  tutor local restart lms"
echo ""
echo "رابط الدفع لأي دورة:"
echo "  http://learnnov.local:8888/payments/checkout/?course_id=<COURSE_ID>"
echo ""
echo "Stripe webhook URL (أضفه في Stripe Dashboard):"
echo "  https://learnnov.com/payments/stripe/webhook/"
