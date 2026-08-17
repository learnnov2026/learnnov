"""
Listen for certificate generation events and create QR codes automatically.
"""
import logging

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

log = logging.getLogger(__name__)


def _cert_verify_url(verify_uuid):
    site_url = getattr(settings, 'LEARNNOV_SITE_URL', 'https://learnnov.com')
    return f'{site_url}/certificates/verify/{verify_uuid}/'


from openedx.core.djangoapps.signals.signals import COURSE_CERT_AWARDED
from lms.djangoapps.certificates.models import GeneratedCertificate

@receiver(COURSE_CERT_AWARDED)
def on_certificate_awarded(sender, user, course_key, status=None, **kwargs):
    """Generate QR code when a certificate is awarded (confirmed passing status)."""
    # Fetch the actual certificate instance to get verify_uuid
    instance = GeneratedCertificate.objects.filter(user=user, course_id=course_key).first()
    if not instance:
        return

    if not instance.verify_uuid:
        return
        
    from .qr_utils import get_or_create_qr
    try:
        get_or_create_qr(
            verify_uuid=instance.verify_uuid,
            verification_url=_cert_verify_url(instance.verify_uuid),
        )
    except Exception as exc:
        log.error('Failed to generate QR for certificate %s: %s', instance.verify_uuid, exc)
