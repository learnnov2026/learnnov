from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class AdPlacement(models.TextChoices):
    DASHBOARD_TOP     = 'dashboard_top',     _('لوحة التحكم — الشريط العلوي')
    DASHBOARD_SIDEBAR = 'dashboard_sidebar', _('لوحة التحكم — الشريط الجانبي')
    COURSE_SEARCH_TOP = 'search_top',        _('بحث المقررات — الشريط العلوي')
    COURSE_SEARCH_SIDEBAR = 'search_sidebar', _('بحث المقررات — الشريط الجانبي')
    COURSE_CATALOG    = 'catalog',           _('دليل المقررات')


class University(models.Model):
    name     = models.CharField(max_length=200, verbose_name=_('اسم الجامعة (بالإنجليزية)'))
    name_ar  = models.CharField(max_length=200, verbose_name=_('اسم الجامعة (بالعربية)'), blank=True)
    logo     = models.ImageField(upload_to='universities/logos/', verbose_name=_('الشعار'), blank=True, null=True)
    website  = models.URLField(verbose_name=_('الموقع الرسمي'), blank=True)
    provider = models.OneToOneField(
        'academic_programs.ProgramProvider', on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='university_marketing',
        verbose_name=_('المزود الأكاديمي')
    )
    staff_user = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='university', verbose_name=_('حساب المشرف')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('نشط'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('جامعة')
        verbose_name_plural = _('الجامعات')

    def __str__(self):
        return self.name_ar or self.name

    def display_name(self, language='ar'):
        """Return name in the requested language, falling back to the other."""
        if language == 'ar':
            return self.name_ar or self.name
        return self.name or self.name_ar


class UniversityAd(models.Model):
    university  = models.ForeignKey(University, on_delete=models.CASCADE, related_name='ads', verbose_name=_('الجامعة'))
    title       = models.CharField(max_length=200, verbose_name=_('عنوان الإعلان (بالإنجليزية)'))
    title_ar    = models.CharField(max_length=200, verbose_name=_('عنوان الإعلان (بالعربية)'), blank=True)
    description    = models.TextField(blank=True, verbose_name=_('الوصف (بالإنجليزية)'))
    description_ar = models.TextField(blank=True, verbose_name=_('الوصف (بالعربية)'))
    image       = models.ImageField(upload_to='university_ads/', verbose_name=_('صورة الإعلان'))
    link_url    = models.URLField(verbose_name=_('رابط الوجهة'))
    placement   = models.CharField(max_length=30, choices=AdPlacement.choices, default=AdPlacement.DASHBOARD_TOP, verbose_name=_('موضع الإعلان'))
    priority    = models.PositiveSmallIntegerField(default=10, verbose_name=_('الأولوية (الأقل = أعلى ظهوراً)'))
    is_active   = models.BooleanField(default=True, verbose_name=_('نشط'))
    start_date  = models.DateTimeField(verbose_name=_('تاريخ البدء'), db_index=True)
    end_date    = models.DateTimeField(verbose_name=_('تاريخ الانتهاء'), db_index=True)
    max_impressions = models.PositiveIntegerField(default=0, verbose_name=_('الحد الأقصى للظهور (0 = غير محدود)'))
    
    # تحسين الأداء: عدادات مخزنة بدلاً من الاستعلام المباشر في كل مرة
    impressions_count = models.PositiveIntegerField(default=0, verbose_name=_('عدد مرات الظهور'))
    clicks_count = models.PositiveIntegerField(default=0, verbose_name=_('عدد النقرات'))
    
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('إعلان جامعي')
        verbose_name_plural = _('إعلانات الجامعات')
        ordering = ['priority', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'start_date', 'end_date']),
        ]

    def __str__(self):
        return f'{self.university} — {self.title_ar or self.title}'

    def get_title(self, language='ar'):
        if language == 'ar':
            return self.title_ar or self.title
        return self.title or self.title_ar

    def get_description(self, language='ar'):
        if language == 'ar':
            return self.description_ar or self.description
        return self.description or self.description_ar

    def is_currently_active(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.start_date or now > self.end_date:
            return False
        if self.max_impressions > 0:
            return self.impressions_count < self.max_impressions
        return True

    @property
    def total_impressions(self):
        return self.impressions_count

    @property
    def total_clicks(self):
        return self.clicks_count

    @property
    def ctr(self):
        if self.total_impressions == 0:
            return 0.0
        return round(self.total_clicks / self.total_impressions * 100, 2)


class AdImpression(models.Model):
    ad         = models.ForeignKey(UniversityAd, on_delete=models.CASCADE, related_name='impressions', verbose_name=_('الإعلان'))
    user       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('المستخدم'))
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name=_('عنوان IP'))
    page       = models.CharField(max_length=100, blank=True, verbose_name=_('الصفحة'))
    timestamp  = models.DateTimeField(auto_now_add=True, verbose_name=_('الوقت'))

    class Meta:
        verbose_name = _('سجل ظهور')
        verbose_name_plural = _('سجلات ظهور الإعلانات')


class AdClick(models.Model):
    ad         = models.ForeignKey(UniversityAd, on_delete=models.CASCADE, related_name='clicks', verbose_name=_('الإعلان'))
    user       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('المستخدم'))
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name=_('عنوان IP'))
    timestamp  = models.DateTimeField(auto_now_add=True, verbose_name=_('الوقت'))

    class Meta:
        verbose_name = _('سجل نقرة')
        verbose_name_plural = _('سجلات نقرات الإعلانات')
