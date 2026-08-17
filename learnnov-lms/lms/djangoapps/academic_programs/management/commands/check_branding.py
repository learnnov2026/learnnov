from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.translation import gettext as _

class Command(BaseCommand):
    help = 'فحص حالة الهوية البصرية والمسميات الموحدة في المنصة'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('--- فحص هوية LearnNov ---'))
        
        branding_data = {
            'PLATFORM_NAME': getattr(settings, 'PLATFORM_NAME', 'Not Set'),
            'SITE_NAME': getattr(settings, 'SITE_NAME', 'Not Set'),
            'LOGO_URL': getattr(settings, 'LOGO_URL', 'Not Set'),
            'TOS_URL': getattr(settings, 'TOS_URL', 'Not Set'),
            'SMS_SENDER': getattr(settings, 'LEARNNOV_SMS_SENDER_ID', 'Not Set'),
            'SUPPORT_EMAIL': getattr(settings, 'LEARNNOV_SUPPORT_EMAIL', 'Not Set'),
        }
        
        for key, value in branding_data.items():
            status = '✅' if value != 'Not Set' else '❌'
            
            # فحص إضافي للروابط والصور
            if key == 'LOGO_URL' and value != 'Not Set':
                if not str(value).startswith('http'):
                    status = '⚠️'
                    value = f"{value} (يجب أن يبدأ بـ http/https)"
            
            self.stdout.write(f"  {status} {key}: {value}")
            
        if branding_data['PLATFORM_NAME'] == 'LearnNov' and branding_data['LOGO_URL'] != 'Not Set':
            self.stdout.write(self.style.SUCCESS('\n✅ عملية توحيد الهوية البصرية مكتملة وناجحة.'))
        else:
            self.stdout.write(self.style.WARNING('\n⚠️ تحذير: الهوية البصرية لا تزال غير مكتملة أو غير دقيقة.'))
