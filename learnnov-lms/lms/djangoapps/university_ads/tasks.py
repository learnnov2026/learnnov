import logging
from celery import shared_task
from django.db.models import F

logger = logging.getLogger(__name__)

@shared_task
def increment_ad_impressions_task(ad_id):
    """تحديث عداد المشاهدات في الخلفية لتجنب بطء قاعدة البيانات."""
    from .models import UniversityAd
    try:
        UniversityAd.objects.filter(id=ad_id).update(impressions_count=F('impressions_count') + 1)
    except Exception as e:
        logger.error(f"Error incrementing ad impressions: {e}")

@shared_task
def increment_ad_clicks_task(ad_id):
    """تحديث عداد النقرات في الخلفية."""
    from .models import UniversityAd
    try:
        UniversityAd.objects.filter(id=ad_id).update(clicks_count=F('clicks_count') + 1)
    except Exception as e:
        logger.error(f"Error incrementing ad clicks: {e}")
