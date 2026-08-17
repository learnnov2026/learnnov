import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
from django.core.cache import cache

class Command(BaseCommand):
    help = 'التحقق النهائي من جاهزية بيئة الإنتاج لمنصة LearnNov'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('▶ بدء الفحص الشامل لمنصة LearnNov...'))
        
        # 1. التحقق من الموديولات المخصصة
        apps = [
            'academic_programs', 'learnnov_payments', 'learnnov_exams',
            'learnnov_marketing', 'program_ads', 'university_ads'
        ]
        for app in apps:
            if app in settings.INSTALLED_APPS:
                self.stdout.write(f'  ✓ الموديول [{app}] محمل بنجاح.')
            else:
                self.stdout.write(self.style.ERROR(f'  ✗ الموديول [{app}] غير موجود في الإعدادات!'))

        # 2. التحقق من قاعدة البيانات
        try:
            connection.ensure_connection()
            self.stdout.write(self.style.SUCCESS('  ✓ اتصال قاعدة البيانات: مستقر.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  ✗ فشل الاتصال بقاعدة البيانات: {e}'))

        # 3. التحقق من Redis
        try:
            cache.set('deploy_check', 'ok', 10)
            if cache.get('deploy_check') == 'ok':
                self.stdout.write(self.style.SUCCESS('  ✓ اتصال Redis (التحميل والتحليل): مستقر.'))
            else:
                raise Exception("Redis not responding correctly")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  ✗ فشل الاتصال بـ Redis: {e}'))

        # 4. التحقق من مفاتيح الربط المالية (بشكل آمن)
        required_vars = [
            'LEARNNOV_HYPERPAY_ACCESS_TOKEN',
            'STRIPE_SECRET_KEY',
            'LEARNNOV_SMS_API_KEY'
        ]
        for var in required_vars:
            val = os.environ.get(var) or getattr(settings, var, None)
            if val:
                self.stdout.write(f'  ✓ متغير البيئة [{var}] تم ضبطه.')
            else:
                self.stdout.write(self.style.WARNING(f'  ! تحذير: [{var}] غير مضبوط (قد يؤثر على الدفع والإشعارات).'))

        # 5. التحقق من الملفات الساكنة
        logo_path = os.path.join(settings.STATIC_ROOT, 'images', 'logo.png')
        if os.path.exists(logo_path):
            self.stdout.write(self.style.SUCCESS('  ✓ شعار المنصة موجود في المسار الساكن.'))
        else:
            self.stdout.write(self.style.WARNING('  ! تحذير: لم يتم العثور على شعار المنصة في STATIC_ROOT. تأكد من تشغيل collectstatic.'))

        self.stdout.write(self.style.SUCCESS('\n🏁 اكتمل الفحص. المنصة جاهزة للإطلاق إذا كانت كافة البنود خضراء.'))
