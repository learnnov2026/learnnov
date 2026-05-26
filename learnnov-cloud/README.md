# LearnNov Cloud — Backend API

هذه هي النسخة السحابية المستقلة (Standalone) من منصة ليرن نوف، مصممة للنشر المجاني على منصة **Render**.

## المكونات
- **Django 4.2**: الإطار الأساسي.
- **PostgreSQL**: قاعدة البيانات (عبر Render Free Tier).
- **Stripe**: بوابة الدفع الدولية.
- **Whitenoise**: لخدمة الملفات الثابتة.

## خطوات النشر

1. **GitHub**:
   - أنشئ مستودعاً جديداً (Private) على GitHub.
   - ارفع محتويات المجلد `learnnov-cloud` إلى المستودع.

2. **Render.com**:
   - أنشئ حساباً في [Render](https://render.com).
   - اختر **Blueprints** ثم **New Blueprint Instance**.
   - اربط حساب GitHub الخاص بك واختر المستودع.
   - سيقوم Render بقراءة ملف `render.yaml` وإنشاء قاعدة بيانات وسيرفر API تلقائياً.

3. **إعدادات البيئة (Env Vars)**:
   - بعد النشر، اذهب إلى إعدادات السيرفر في Render وأضف المفاتيح التالية:
     - `STRIPE_SECRET_KEY`: مفتاح Stripe السري.
     - `STRIPE_PUBLISHABLE_KEY`: مفتاح Stripe العام.

## الروابط
- الصفحة الرئيسية: `https://learnnov-api.onrender.com`
- لوحة الإدارة: `https://learnnov-api.onrender.com/admin/`
- فحص الصحة: `https://learnnov-api.onrender.com/health/`
