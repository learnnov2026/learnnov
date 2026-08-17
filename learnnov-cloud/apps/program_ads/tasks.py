import logging
from apps.university_ads.tasks import hybrid_task
from django.db.models import F

logger = logging.getLogger(__name__)


@hybrid_task
def increment_program_ad_impressions_task(ad_id):
    """تحديث عداد مشاهدات الإعلان atomically في الخلفية."""
    from .models import Advertisement
    try:
        Advertisement.objects.filter(id=ad_id).update(total_impressions=F('total_impressions') + 1)
    except Exception as e:
        logger.error(f"Error incrementing program ad impressions in task: {e}")


@hybrid_task
def increment_program_ad_clicks_task(ad_id):
    """تحديث عداد نقرات الإعلان atomically في الخلفية."""
    from .models import Advertisement
    try:
        Advertisement.objects.filter(id=ad_id).update(total_clicks=F('total_clicks') + 1)
    except Exception as e:
        logger.error(f"Error incrementing program ad clicks in task: {e}")
