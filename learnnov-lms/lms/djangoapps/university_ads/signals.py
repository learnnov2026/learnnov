from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F
from .models import AdImpression, AdClick

from .tasks import increment_ad_impressions_task, increment_ad_clicks_task

@receiver(post_save, sender=AdImpression)
def update_ad_impressions_count(sender, instance, created, **kwargs):
    """زيادة عداد المشاهدات في الخلفية."""
    if created:
        increment_ad_impressions_task.delay(instance.ad.id)

@receiver(post_save, sender=AdClick)
def update_ad_clicks_count(sender, instance, created, **kwargs):
    """زيادة عداد النقرات في الخلفية."""
    if created:
        increment_ad_clicks_task.delay(instance.ad.id)
