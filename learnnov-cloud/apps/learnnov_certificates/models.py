from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class GeneratedCertificate(models.Model):
    """
    نموذج الشهادات المصدرة للطلاب عند إكمال الكورسات/البرامج.
    يحاكي تماماً واجهة نموذج Open edX ولكن بشكل مستقل.
    """
    STATUS_CHOICES = [
        ('downloadable', _('جاهزة للتحميل')),
        ('generating', _('قيد الإصدار')),
        ('error', _('خطأ في الإصدار')),
    ]
    
    verify_uuid = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    course_id = models.CharField(max_length=255, db_index=True)
    course_name = models.CharField(max_length=255, blank=True)
    grade = models.CharField(max_length=10, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='downloadable')
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Generated Certificate')
        verbose_name_plural = _('Generated Certificates')

    def __str__(self):
        return f"{self.user.username} - {self.course_id} ({self.status})"


class CertificateQRCode(models.Model):
    """رمز الاستجابة السريعة (QR) للتحقق من مصداقية الشهادة."""
    verify_uuid      = models.CharField(max_length=32, unique=True, db_index=True)
    qr_image         = models.ImageField(upload_to='certificates/qr/', verbose_name=_('QR Code Image'))
    verification_url = models.URLField(verbose_name=_('Verification URL'))
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Certificate QR Code')
        verbose_name_plural = _('Certificate QR Codes')

    def __str__(self):
        return f'QR — {self.verify_uuid}'
