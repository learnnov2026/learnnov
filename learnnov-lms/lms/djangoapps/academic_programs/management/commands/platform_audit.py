from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import models
from django.db.models import Count
from lms.djangoapps.academic_programs.models import AcademicProgram, ProgramApplication, ProgramProvider
from lms.djangoapps.learnnov_payments.models import Order, OrderStatus
from lms.djangoapps.learnnov_certificates.models import CertificateQRCode

class Command(BaseCommand):
    help = 'إجراء فحص شامل لصحة النظام والبيانات والهوية البصرية'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n🔍 بدء التدقيق الشامل لمنصة LearnNov...'))
        
        # 1. فحص الهوية البصرية
        self.stdout.write(self.style.SUCCESS('\n[1] فحص الهوية البصرية الإعدادات:'))
        branding_keys = [
            'PLATFORM_NAME', 'SITE_NAME', 'LOGO_URL', 
            'LEARNNOV_SUPPORT_EMAIL', 'LEARNNOV_SITE_URL'
        ]
        for key in branding_keys:
            val = getattr(settings, key, None)
            status = '✅' if val and 'edx' not in str(val).lower() else '❌'
            
            # فحص إضافي للأمان (HTTPS)
            if key in ['LEARNNOV_SITE_URL', 'SITE_URL'] and val:
                if not str(val).startswith('https'):
                    status = '⚠️'
                    val = f"{val} (يفضل استخدام HTTPS)"
            
            self.stdout.write(f"  {status} {key}: {val}")

        # 2. فحص حالة البيانات الأكاديمية
        self.stdout.write(self.style.SUCCESS('\n[2] حالة البيانات الأكاديمية:'))
        p_count = AcademicProgram.objects.count()
        app_count = ProgramApplication.objects.count()
        prov_count = ProgramProvider.objects.count()
        self.stdout.write(f"  - البرامج المسجلة: {p_count}")
        self.stdout.write(f"  - طلبات التقديم: {app_count}")
        self.stdout.write(f"  - المؤسسات التعليمية: {prov_count}")
        
        # فحص وجود برامج بدون مدرب/مؤسسة
        orphans = AcademicProgram.objects.filter(provider__isnull=True).count()
        if orphans > 0:
            self.stdout.write(self.style.ERROR(f"  - ⚠️ تحذير: يوجد {orphans} برنامج بدون مؤسسة!"))

        # 3. فحص منظومة المدفوعات
        self.stdout.write(self.style.SUCCESS('\n[3] تدقيق منظومة المدفوعات:'))
        orders = Order.objects.aggregate(
            total=Count('id'),
            paid=Count('id', filter=models.Q(status=OrderStatus.PAID))
        )
        self.stdout.write(f"  - إجمالي الطلبات: {orders['total']}")
        self.stdout.write(f"  - الطلبات المدفوعة: {orders['paid']}")
        
        # فحص إعدادات البوابات
        gateways = {
            'Stripe': 'LEARNNOV_STRIPE_SECRET_KEY',
            'HyperPay': 'LEARNNOV_HYPERPAY_ACCESS_TOKEN'
        }
        for name, key in gateways.items():
            is_set = bool(getattr(settings, key, None))
            self.stdout.write(f"  - بوابة {name}: {'✅ مكونة' if is_set else '⚠️ غير مكتملة'}")

        # 4. فحص سلامة الشهادات والـ QR
        self.stdout.write(self.style.SUCCESS('\n[4] سلامة الشهادات والتحقق:'))
        total_certs = CertificateQRCode.objects.count()
        broken_qr = CertificateQRCode.objects.filter(qr_image__isnull=True).count()
        self.stdout.write(f"  - إجمالي الشهادات المصدرة: {total_certs}")
        if broken_qr > 0:
            self.stdout.write(self.style.WARNING(f"  - ⚠️ تنبيه: يوجد {broken_qr} شهادة بدون كود QR."))

        self.stdout.write(self.style.MIGRATE_HEADING('\n✅ انتهى التدقيق. النظام في حالة مستقرة.'))
