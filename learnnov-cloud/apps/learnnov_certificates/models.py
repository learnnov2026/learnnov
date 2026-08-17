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
    
    verify_uuid = models.CharField(_('معرف التحقق'), max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates', verbose_name=_('المستخدم'))
    course_id = models.CharField(_('معرف المساق'), max_length=255, db_index=True)
    course_name = models.CharField(_('اسم المساق'), max_length=255, blank=True)
    grade = models.CharField(_('الدرجة / التقدير'), max_length=10, blank=True)
    status = models.CharField(_('الحالة'), max_length=30, choices=STATUS_CHOICES, default='downloadable')
    created_date = models.DateTimeField(_('تاريخ الإصدار'), auto_now_add=True)

    class Meta:
        verbose_name = _('شهادة مصدرة')
        verbose_name_plural = _('الشهادات المصدرة')

    def __str__(self):
        return f"{self.user.username} - {self.course_id} ({self.status})"


class CertificateQRCode(models.Model):
    """رمز الاستجابة السريعة (QR) للتحقق من مصداقية الشهادة."""
    verify_uuid      = models.CharField(_('معرف التحقق'), max_length=32, unique=True, db_index=True)
    qr_image         = models.ImageField(upload_to='certificates/qr/', verbose_name=_('صورة رمز QR'))
    verification_url = models.URLField(verbose_name=_('رابط التحقق'))
    created_at       = models.DateTimeField(_('تاريخ الإنشاء'), auto_now_add=True)

    class Meta:
        verbose_name = _('رمز QR للشهادة')
        verbose_name_plural = _('رموز QR للشهادات')

    def __str__(self):
        return f'QR — {self.verify_uuid}'


class SpecializationCertificate(models.Model):
    """الشهادات المصدرة للطلاب عند إكمال التخصص المهني كاملاً."""
    STATUS_CHOICES = [
        ('downloadable', _('جاهزة للتحميل')),
        ('generating', _('قيد الإصدار')),
        ('error', _('خطأ في الإصدار')),
    ]
    
    verify_uuid = models.CharField(_('معرف التحقق'), max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='specialization_certificates', verbose_name=_('المستخدم'))
    specialization = models.ForeignKey('academic_programs.Specialization', on_delete=models.CASCADE, related_name='certificates', verbose_name=_('التخصص المهني'))
    status = models.CharField(_('الحالة'), max_length=30, choices=STATUS_CHOICES, default='downloadable')
    created_date = models.DateTimeField(_('تاريخ الإصدار'), auto_now_add=True)

    class Meta:
        verbose_name = _('شهادة تخصص مهني')
        verbose_name_plural = _('شهادات التخصصات المهنية')

    def __str__(self):
        return f"{self.user.username} - {self.specialization.title} ({self.status})"

