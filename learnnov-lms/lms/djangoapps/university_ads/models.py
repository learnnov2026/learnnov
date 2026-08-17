from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class AdPlacement(models.TextChoices):
    DASHBOARD_TOP     = 'dashboard_top',     _('Dashboard — Top Banner')
    DASHBOARD_SIDEBAR = 'dashboard_sidebar', _('Dashboard — Sidebar')
    COURSE_SEARCH_TOP = 'search_top',        _('Course Search — Top Banner')
    COURSE_SEARCH_SIDEBAR = 'search_sidebar', _('Course Search — Sidebar')
    COURSE_CATALOG    = 'catalog',           _('Course Catalog')


class University(models.Model):
    name     = models.CharField(max_length=200, verbose_name=_('University Name (English)'))
    name_ar  = models.CharField(max_length=200, verbose_name=_('University Name (Arabic)'), blank=True)
    logo     = models.ImageField(upload_to='universities/logos/', verbose_name=_('Logo'), blank=True, null=True)
    website  = models.URLField(verbose_name=_('Official Website'), blank=True)
    provider = models.OneToOneField(
        'academic_programs.ProgramProvider', on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='university_marketing',
        verbose_name=_('Academic Provider')
    )
    staff_user = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='university', verbose_name=_('Staff Account')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('Active'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('University')
        verbose_name_plural = _('Universities')

    def __str__(self):
        return self.name_ar or self.name

    def display_name(self, language='ar'):
        """Return name in the requested language, falling back to the other."""
        if language == 'ar':
            return self.name_ar or self.name
        return self.name or self.name_ar


class UniversityAd(models.Model):
    university  = models.ForeignKey(University, on_delete=models.CASCADE, related_name='ads', verbose_name=_('University'))
    title       = models.CharField(max_length=200, verbose_name=_('Ad Title (English)'))
    title_ar    = models.CharField(max_length=200, verbose_name=_('Ad Title (Arabic)'), blank=True)
    description    = models.TextField(blank=True, verbose_name=_('Description (English)'))
    description_ar = models.TextField(blank=True, verbose_name=_('Description (Arabic)'))
    image       = models.ImageField(upload_to='university_ads/', verbose_name=_('Ad Image'))
    link_url    = models.URLField(verbose_name=_('Destination URL'))
    placement   = models.CharField(max_length=30, choices=AdPlacement.choices, default=AdPlacement.DASHBOARD_TOP, verbose_name=_('Placement'))
    priority    = models.PositiveSmallIntegerField(default=10, verbose_name=_('Priority (lower = higher)'))
    is_active   = models.BooleanField(default=True, verbose_name=_('Active'))
    start_date  = models.DateTimeField(verbose_name=_('Start Date'), db_index=True)
    end_date    = models.DateTimeField(verbose_name=_('End Date'), db_index=True)
    max_impressions = models.PositiveIntegerField(default=0, verbose_name=_('Max Impressions (0 = unlimited)'))
    
    # تحسين الأداء: عدادات مخزنة بدلاً من الاستعلام المباشر في كل مرة
    impressions_count = models.PositiveIntegerField(default=0, verbose_name=_('Impressions Count'))
    clicks_count = models.PositiveIntegerField(default=0, verbose_name=_('Clicks Count'))
    
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('University Ad')
        verbose_name_plural = _('University Ads')
        ordering = ['priority', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'start_date', 'end_date']),
        ]

    def __str__(self):
        return f'{self.university} — {self.title}'

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
    ad         = models.ForeignKey(UniversityAd, on_delete=models.CASCADE, related_name='impressions')
    user       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    page       = models.CharField(max_length=100, blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Impression')
        verbose_name_plural = _('Impressions')


class AdClick(models.Model):
    ad         = models.ForeignKey(UniversityAd, on_delete=models.CASCADE, related_name='clicks')
    user       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Click')
        verbose_name_plural = _('Clicks')
