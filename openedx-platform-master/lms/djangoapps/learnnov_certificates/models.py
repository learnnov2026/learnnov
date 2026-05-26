from django.db import models
from django.utils.translation import gettext_lazy as _


class CertificateQRCode(models.Model):
    verify_uuid      = models.CharField(max_length=32, unique=True, db_index=True)
    qr_image         = models.ImageField(upload_to='certificates/qr/', verbose_name=_('QR Code Image'))
    verification_url = models.URLField(verbose_name=_('Verification URL'))
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Certificate QR Code')
        verbose_name_plural = _('Certificate QR Codes')

    def __str__(self):
        return f'QR — {self.verify_uuid}'
