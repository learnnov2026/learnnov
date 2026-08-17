import logging
import threading
import sys
from django.db.models import F
from celery import shared_task

logger = logging.getLogger(__name__)

class DelayableTask:
    """
    محاكاة خفيفة لمهام Celery باستخدام خيوط (Threads) خلفية.
    تسمح بتحديث العدادات بشكل منفصل لتسريع استجابة السيرفر.
    """
    def __init__(self, func):
        self.func = func

    def delay(self, *args, **kwargs):
        if 'test' in sys.argv:
            self._run_safe(*args, **kwargs)
            return None
        thread = threading.Thread(target=self._run_safe, args=args, kwargs=kwargs)
        thread.daemon = True
        thread.start()
        return thread

    def _run_safe(self, *args, **kwargs):
        try:
            self.func(*args, **kwargs)
        except Exception as e:
            logger.exception(f"Error in background task {self.func.__name__}: {e}")

def hybrid_task(func):
    # 1. Create a real Celery task
    celery_task = shared_task(func)
    
    # 2. Create a fallback task
    fallback_task = DelayableTask(func)
    
    class HybridTaskWrapper:
        def __init__(self):
            self.celery_task = celery_task
            self.fallback_task = fallback_task
            
        def delay(self, *args, **kwargs):
            if 'test' in sys.argv:
                return self.fallback_task.delay(*args, **kwargs)
            
            try:
                # Try sending task to Celery Broker
                return self.celery_task.delay(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Celery broker not available, falling back to background Thread: {e}")
                return self.fallback_task.delay(*args, **kwargs)
                
        def __call__(self, *args, **kwargs):
            return func(*args, **kwargs)
            
    return HybridTaskWrapper()

@hybrid_task
def increment_ad_impressions_task(ad_id):
    """تحديث عداد المشاهدات في الخلفية atomically."""
    from .models import UniversityAd
    try:
        UniversityAd.objects.filter(id=ad_id).update(impressions_count=F('impressions_count') + 1)
    except Exception as e:
        logger.error(f"Error incrementing ad impressions in task: {e}")

@hybrid_task
def increment_ad_clicks_task(ad_id):
    """تحديث عداد النقرات في الخلفية atomically."""
    from .models import UniversityAd
    try:
        UniversityAd.objects.filter(id=ad_id).update(clicks_count=F('clicks_count') + 1)
    except Exception as e:
        logger.error(f"Error incrementing ad clicks in task: {e}")
