from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from lms.djangoapps.program_ads.models import AdImpression

class Command(BaseCommand):
    help = 'تنظيف إحصائيات الإعلانات القديمة (أكبر من 90 يوماً) لضمان أداء قاعدة البيانات'

    def handle(self, *args, **options):
        threshold = timezone.now() - timedelta(days=90)
        total_deleted = 0
        
        # الحذف على دفعات (Batch Deletion) لتجنب قفل الجداول لفترة طويلة
        while True:
            # نحدد المعرفات أولاً ثم نحذفها لضمان الأداء
            ids_to_delete = AdImpression.objects.filter(created_at__lt=threshold).values_list('id', flat=True)[:5000]
            if not ids_to_delete:
                break
                
            count, _ = AdImpression.objects.filter(id__in=list(ids_to_delete)).delete()
            total_deleted += count
            self.stdout.write(f'تم حذف {total_deleted} سجل حتى الآن...')

        self.stdout.write(
            self.style.SUCCESS(f'تم بنجاح الانتهاء من التنظيف. إجمالي المحذوف: {total_deleted} سجل.')
        )
