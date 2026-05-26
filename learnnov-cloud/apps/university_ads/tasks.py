import logging
import threading
from django.db.models import F

logger = logging.getLogger(__name__)

class DelayableTask:
    """
    محاكاة خفيفة لمهام Celery باستخدام خيوط (Threads) خلفية.
    تسمح بتحديث العدادات بشكل منفصل لتسريع استجابة السيرفر.
    """
    def __init__(self, func):
        self.func = func

    def delay(self, *args, **kwargs):
        thread = threading.Thread(target=self._run_safe, args=args, kwargs=kwargs)
        thread.daemon = True
        thread.start()
        return thread

    def _run_safe(self, *args, **kwargs):
        try:
            self.func(*args, **kwargs)
        except Exception as e:
            logger.exception(f"Error in background task {self.func.__name__}: {e}")

def task(func):
    return DelayableTask(func)

@task
def increment_ad_impressions_task(ad_id):
    """تحديث عداد المشاهدات في الخلفية atomically."""
    from .models import UniversityAd
    try:
        UniversityAd.objects.filter(id=ad_id).update(impressions_count=F('impressions_count') + 1)
    except Exception as e:
        logger.error(f"Error incrementing ad impressions in task: {e}")

@task
def increment_ad_clicks_task(ad_id):
    """تحديث عداد النقرات في الخلفية atomically."""
    from .models import UniversityAd
    try:
        UniversityAd.objects.filter(id=ad_id).update(clicks_count=F('clicks_count') + 1)
    except Exception as e:
        logger.error(f"Error incrementing ad clicks in task: {e}")
