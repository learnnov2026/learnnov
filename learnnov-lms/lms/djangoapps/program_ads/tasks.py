import logging
from celery import shared_task
from django.db.models import F

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def record_ad_event_task(self, ad_id, event_type, user_id=None,
                         ip_address=None, user_agent='',
                         referrer='', session_key=''):
    """تسجيل حدث إعلاني (ظهور أو نقرة) في الخلفية وتحديث العدادات."""
    from .models import Advertisement, AdImpression
    try:
        ad = Advertisement.objects.get(pk=ad_id)
    except Advertisement.DoesNotExist:
        logger.warning('Ad event task: ad_id=%s not found, skipping.', ad_id)
        return

    # تسجيل الحدث
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = None
    if user_id:
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            pass

    AdImpression.objects.create(
        advertisement=ad,
        event_type=event_type,
        user=user,
        ip_address=ip_address,
        user_agent=user_agent[:500],
        referrer=referrer[:200] if referrer else '',
        session_key=session_key or '',
    )

    # تحديث العدادات الذرية على النموذج الأساسي
    if event_type == 'impression':
        Advertisement.objects.filter(pk=ad_id).update(
            total_impressions=F('total_impressions') + 1,
            total_spent=F('total_spent') + F('cost_per_impression')
        )
    elif event_type == 'click':
        Advertisement.objects.filter(pk=ad_id).update(
            total_clicks=F('total_clicks') + 1,
            total_spent=F('total_spent') + F('cost_per_click')
        )

    logger.debug('Recorded %s for ad %s', event_type, ad_id)
