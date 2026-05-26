#!/usr/bin/env bash
# =============================================================================
# backup_learnnov.sh — نسخة احتياطية لبيانات منصة LearnNov
# =============================================================================

GREEN='\033[0;32m'
NC='\033[0m'
ok() {
    printf "${GREEN}✓${NC} %s\n" "$*"
}

BACKUP_DIR="$HOME/backups/learnnov"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
mkdir -p "$BACKUP_DIR"

echo "▶ بدء النسخ الاحتياطي: $DATE"

# 1. استخراج الإعدادات من Tutor بشكل آمن
MYSQL_PASS=$(tutor config printvalue MYSQL_ROOT_PASSWORD 2>/dev/null || echo "")
if [[ -z "$MYSQL_PASS" ]]; then
    echo "❌ خطأ: لم يتم العثور على كلمة مرور MySQL. تأكد من تثبيت Tutor."
    exit 1
fi

# 2. نسخ قاعدة البيانات (MySQL)
echo "  - جاري نسخ MySQL..."
if tutor local run mysql mysqldump -u root -p"$MYSQL_PASS" --all-databases > "$BACKUP_DIR/db_backup_$DATE.sql"; then
    ok "تم نسخ MySQL بنجاح."
else
    echo "❌ فشل نسخ MySQL!"
    exit 1
fi

# 3. نسخ قاعدة البيانات (MongoDB)
echo "  - جاري نسخ MongoDB..."
if tutor local run mongodb mongodump --archive > "$BACKUP_DIR/mongo_backup_$DATE.gz"; then
    ok "تم نسخ MongoDB بنجاح."
else
    echo "❌ فشل نسخ MongoDB!"
    exit 1
fi

# 4. نسخ الملفات المرفوعة (Media)
MEDIA_PATH=$(tutor config printvalue RUN_DIR)/data/lms/media
echo "  - جاري نسخ ملفات الميديا من: $MEDIA_PATH"
if tar -czf "$BACKUP_DIR/media_backup_$DATE.tar.gz" -C "$MEDIA_PATH" . 2>/dev/null; then
    ok "تم نسخ الملفات بنجاح."
else
    echo "⚠️ تنبيه: فشل نسخ الميديا أو المجلد فارغ."
fi

# 5. تنظيف النسخ القديمة (أكبر من 30 يوم)
find "$BACKUP_DIR" -type f -mtime +30 -delete
ok "تم تنظيف النسخ القديمة."

echo "✅ اكتملت العملية بنجاح في: $BACKUP_DIR"
